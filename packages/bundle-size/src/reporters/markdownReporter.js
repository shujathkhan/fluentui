const fs = require('fs-extra');
const path = require('path');
const { findPackageRoot } = require('workspace-tools');

const { formatBytes } = require('../utils/helpers');
const sortComparedReport = require('../utils/sortComparedReport');

/** @typedef {import('../commands/compareReports').ComparedReportEntry} ComparedReportEntry */
/** @typedef {import('../commands/compareReports').ComparedReport} ComparedReport */

/**
 * @param {number} value
 *
 * @return {string}
 */
function getDirectionSymbol(value) {
  if (value < 0) {
    return '<img aria-hidden="true" src="https://microsoft.github.io/sizeAuditor-website/images/icons/Decrease.svg" />';
  }

  if (value > 0) {
    return '<img aria-hidden="true" src="https://microsoft.github.io/sizeAuditor-website/images/icons/IncreaseYellow.svg" />';
  }

  return '';
}

/**
 * @param {import('../utils/calculateDiffByMetric').DiffByMetric} diff
 *
 * @return {string}
 */
function formatDelta({ delta }) {
  if (delta === 0) {
    return '';
  }

  return `\`${formatBytes(delta)}\` ${getDirectionSymbol(delta)}`;
}

/**
 * @param {ComparedReport} report
 *
 * @return {[ComparedReportEntry[], ComparedReportEntry[]]}
 */
function partitionReport(report) {
  /** @type ComparedReportEntry[] */
  const changedEntries = [];
  /** @type ComparedReportEntry[] */
  const unchangedEntries = [];

  report.forEach(reportEntry => {
    if (reportEntry.diff.gzip.delta === 0 || reportEntry.diff.minified.delta === 0) {
      unchangedEntries.push(reportEntry);
    } else {
      changedEntries.push(reportEntry);
    }
  });

  return [sortComparedReport(changedEntries), sortComparedReport(unchangedEntries)];
}

/**
 * @param {ComparedReport} result
 * @param {string} commitSHA
 */
module.exports = async function markdownReporter(result, commitSHA) {
  const artifactsDir = path.resolve(/** @type {string }*/ (findPackageRoot(__dirname)), 'dist');
  const report = [];

  report.push('## 📊 Bundle size report');
  report.push('');

  const [changedEntries, unchangedEntries] = partitionReport(result);

  if (changedEntries.length > 0) {
    report.push('| Package & Exports | Baseline (minified/GZIP) | PR    | Change     |');
    report.push('| :---------------- | -----------------------: | ----: | ---------: |');

    changedEntries.forEach(entry => {
      const title = `<samp>${entry.packageName}</samp> <br /> <abbr title='${entry.path}'>${entry.name}</abbr>`;
      const before = [`\`${formatBytes(entry.minifiedSize)}\``, '<br />', `\`${formatBytes(entry.gzippedSize)}\``].join(
        '',
      );
      const after = [
        `\`${formatBytes(entry.minifiedSize + entry.diff.minified.delta)}\``,
        '<br />',
        `\`${formatBytes(entry.gzippedSize + entry.diff.gzip.delta)}\``,
      ].join('');
      const difference = [`${formatDelta(entry.diff.minified)}`, '<br />', `${formatDelta(entry.diff.gzip)}`].join('');

      report.push(`| ${title} | ${before} | ${after} | ${difference}|`);
    });

    report.push('');
  }

  if (unchangedEntries.length > 0) {
    report.push('<details>');
    report.push('<summary>Unchanged files</summary>');
    report.push('');

    report.push('| Package & Exports | Size (minified/GZIP) |');
    report.push('| ----------------- | -------------------: |');

    unchangedEntries.forEach(entry => {
      const title = `<samp>${entry.packageName}</samp> <br /> <abbr title='${entry.path}'>${entry.name}</abbr>`;
      const size = [`\`${formatBytes(entry.minifiedSize)}\``, '<br />', `\`${formatBytes(entry.gzippedSize)}\``].join(
        '',
      );

      report.push(`| ${title} | ${size} |`);
    });

    report.push('</details>');
  }

  report.push(
    `<sub>🤖 This report was generated against <a href='https://github.com/microsoft/fluentui/commit/${commitSHA}'>${commitSHA}</a></sub>`,
  );

  await fs.outputFile(path.join(artifactsDir, 'bundle-size.md'), report.join('\n'));
};
