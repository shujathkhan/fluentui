/** @typedef {import('../commands/compareReports').ComparedReportEntry} ComparedReportEntry */
/** @typedef {import('../commands/compareReports').ComparedReport} ComparedReport */

/**
 * @param {ComparedReportEntry} a
 * @param {ComparedReportEntry} b
 */
function compareReports(a, b) {
  return a.packageName.localeCompare(b.packageName) || a.path.localeCompare(b.path);
}

/**
 * @param {ComparedReport} report
 */
module.exports = function sortComparedReport(report) {
  return report.slice().sort(compareReports);
};
