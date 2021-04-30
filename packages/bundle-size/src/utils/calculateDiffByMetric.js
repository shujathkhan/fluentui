/** @typedef {import("../commands/generateReport").BundleSizeReportEntry} BundleSizeReportEntry */

/**
 * @param {number} value
 * @param {number} fractionDigits
 *
 * @return {number}
 */
function roundNumber(value, fractionDigits) {
  return parseFloat(value.toFixed(fractionDigits));
}

/**
 * @param {number} fraction
 *
 * @return {string}
 */
function formatPercent(fraction) {
  if (fraction < 0.001) {
    // 0.09% and lower
    fraction = roundNumber(fraction, 4);
  } else if (fraction < 0.01) {
    // 0.9% and lower
    fraction = roundNumber(fraction, 3);
  } else {
    // 1% and higher
    fraction = roundNumber(fraction, 2);
  }

  return fraction.toLocaleString(undefined, {
    style: 'percent',
    maximumSignificantDigits: 3,
  });
}

/** @typedef {{ delta: number, percent: string }} DiffByMetric */

/**
 * @param {BundleSizeReportEntry} local
 * @param {BundleSizeReportEntry} remote
 * @param {'minifiedSize' | 'gzippedSize'} property
 *
 * @return {DiffByMetric}
 */
module.exports = function calculateDiffByMetric(local, remote, property) {
  const delta = remote[property] - local[property];

  return {
    delta,
    percent: formatPercent(delta / remote[property]),
  };
};
