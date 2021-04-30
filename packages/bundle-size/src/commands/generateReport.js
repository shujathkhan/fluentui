const chalk = require('chalk');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const { findGitRoot, findPackageRoot } = require('workspace-tools');

const { hrToSeconds } = require('../utils/helpers');

/** @typedef {import('../utils/buildFixture').BuildResult} BuildResult */

/** @typedef {BuildResult & { packageName: string }} BundleSizeReportEntry */
/** @typedef {BundleSizeReportEntry[]} BundleSizeReport */

/**
 * @param {string} reportFile
 *
 * @return {Promise<[string, BuildResult[]]>}
 */
async function readReport(reportFile) {
  const reportFilePath = path.resolve(process.cwd(), reportFile);

  const packageName = path.basename(/** @type {string}*/ (findPackageRoot(reportFilePath)));
  const packageReport = await fs.readJSON(reportFilePath);

  return [packageName, packageReport];
}

/**
 * @return {Promise<BundleSizeReport>}
 */
async function collectLocalReport() {
  /** @type {string[]} */
  const reportFiles = glob.sync('packages/*/dist/bundle-size/bundle-size.json', {
    cwd: /** @type {string} */ (findGitRoot(process.cwd())),
  });

  /** @type {[string, BuildResult[]][]} */
  const reports = await Promise.all(reportFiles.map(readReport));

  return reports.reduce(
    (/** @type {BundleSizeReport} */ acc, [/** @type {string} */ packageName, /** @type {BuildResult[]} */ report]) => {
      return [...acc, ...report.map(reportEntry => ({ packageName, ...reportEntry }))];
    },
    /** @type {BundleSizeReport} */ [],
  );
}

/**
 * @param {{ verbose: boolean }} options
 */
async function generateReport(options) {
  const { verbose } = options;

  const startTime = process.hrtime();
  const artifactsDir = path.resolve(/** @type {string }*/ (findPackageRoot(__dirname)), 'dist');

  await fs.remove(artifactsDir);

  if (verbose) {
    console.log(`${chalk.blue('[i]')} artifacts dir is cleared`);
  }

  const localReport = await collectLocalReport();

  await fs.outputFile(path.join(artifactsDir, 'bundle-size.json'), JSON.stringify(localReport));

  if (verbose) {
    console.log(`Completed in ${hrToSeconds(process.hrtime(startTime))}`);
  }
}

// ---

exports.collectLocalReport = collectLocalReport;

exports.command = 'generate-report';
exports.desc = 'creates a local report for bundle size';
exports.handler = generateReport;
