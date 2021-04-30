const chalk = require('chalk');
const { default: fetch } = require('node-fetch');

const cliReporter = require('../reporters/cliReporter');
const markdownReporter = require('../reporters/markdownReporter');
const calculateDiffByMetric = require('../utils/calculateDiffByMetric');
const { hrToSeconds } = require('../utils/helpers');
const { collectLocalReport } = require('./generateReport');

/** @typedef {import('./generateReport').BundleSizeReportEntry} BundleSizeReportEntry */
/** @typedef {import('./generateReport').BundleSizeReport} BundleSizeReport */

/** @typedef {import('../utils/calculateDiffByMetric').DiffByMetric} DiffByMetric */

/**
 * Grabs data for a branch from Azure Table Storage.
 *
 * @param {string} branch
 *
 * @return {Promise<[string, BundleSizeReport]>}
 */
async function getRemoteReport(branch) {
  const response = await fetch(`https://fluentbundlesize.azurewebsites.net/api/latest?branch=${branch}`);
  const report = await response.json();

  /** @type {BundleSizeReport} */
  const result = [];
  let commitSHA = '';

  report.forEach((/** @type {unknown} */ entity) => {
    const { commitSHA: entrySHA, ...rest } = /** @type {BundleSizeReportEntry & {commitSHA: string}} */ (entity);

    commitSHA = entrySHA;
    result.push(rest);
  });

  return [commitSHA, result];
}

/** @typedef {{ empty: boolean, minified: DiffByMetric, gzip: DiffByMetric }} DiffForEntry */
/** @typedef {BundleSizeReportEntry & { diff: DiffForEntry }} ComparedReportEntry */
/** @typedef {ComparedReportEntry[]} ComparedReport */

/** @type DiffForEntry */
const emptyDiff = {
  empty: true,

  minified: { delta: Infinity, percent: '100%' },
  gzip: { delta: Infinity, percent: '100%' },
};

/**
 * @param {BundleSizeReport} localReport
 * @param {BundleSizeReport} remoteReport
 *
 * @return {ComparedReport}
 */
function compareResults(localReport, remoteReport) {
  return localReport.map(localEntry => {
    /** @type {BundleSizeReportEntry | undefined} */
    const remoteEntry = remoteReport.find(
      entry => localEntry.packageName === entry.packageName && localEntry.path === entry.path,
    );
    const diff = remoteEntry
      ? {
          empty: false,
          minified: calculateDiffByMetric(localEntry, remoteEntry, 'minifiedSize'),
          gzip: calculateDiffByMetric(localEntry, remoteEntry, 'gzippedSize'),
        }
      : emptyDiff;

    return {
      ...localEntry,
      diff,
    };
  });
}

/**
 * @param {{ branch: string, output: 'cli' | 'markdown', verbose: boolean }} options
 */
async function compareReports(options) {
  const { branch, output, verbose } = options;
  const startTime = process.hrtime();

  const localReportStartTime = process.hrtime();
  const localReport = await collectLocalReport();

  if (verbose) {
    console.log(
      [chalk.blue('[i]'), `Local report prepared in ${hrToSeconds(process.hrtime(localReportStartTime))}`].join(' '),
    );
  }

  const remoteReportStartTime = process.hrtime();
  const [commitSHA, remoteReport] = await getRemoteReport(branch);

  if (verbose) {
    if (commitSHA === '') {
      console.log([chalk.blue('[i]'), `Remote report for "${branch}" was not found`].join(' '));
    } else {
      console.log(
        [
          chalk.blue('[i]'),
          `Remote report for "${commitSHA}" fetched in ${hrToSeconds(process.hrtime(remoteReportStartTime))}`,
        ].join(' '),
      );
    }
  }

  const result = compareResults(localReport, remoteReport);

  switch (output) {
    case 'cli':
      await cliReporter(result);
      break;
    case 'markdown':
      await markdownReporter(result, commitSHA);
      break;
  }

  if (verbose) {
    console.log(`Completed in ${hrToSeconds(process.hrtime(startTime))}`);
  }
}

// ---

exports.command = 'compare-reports';
exports.desc = 'compares local and remote results';
exports.builder = function (/** @type import("yargs").Argv */ yargs) {
  return yargs
    .option('branch', {
      alias: 'b',
      type: 'string',
      description: 'A branch to compare against',
      default: 'master',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      choices: ['cli', 'markdown'],
      description: 'Defines a reported output',
      default: 'cli',
    });
};
exports.handler = compareReports;
