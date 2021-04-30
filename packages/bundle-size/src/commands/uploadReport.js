const { odata, TableClient, TablesSharedKeyCredential, TableTransaction } = require('@azure/data-tables');
const chalk = require('chalk');

const { hrToSeconds } = require('../utils/helpers');
const { collectLocalReport } = require('./generateReport');

/** @typedef {import('./generateReport').BundleSizeReportEntry} BundleSizeReportEntry */

const AZURE_STORAGE_ACCOUNT = 'fluentbundlesize';
const AZURE_STORAGE_TABLE_NAME = 'latest';
const AZURE_ACCOUNT_KEY = process.env.BUNDLESIZE_ACCOUNT_KEY;

/**
 *  @param {BundleSizeReportEntry} entry
 *
 * @return {string}
 */
function createRowKey(entry) {
  // Azure does not support slashes in "rowKey"
  // https://docs.microsoft.com/archive/blogs/jmstall/azure-storage-naming-rules
  return `${entry.packageName}${entry.path.replace(/\//g, '')}`;
}

/**
 * @param {{ branch: string, 'commit-sha': string, verbose: boolean }} options
 */
async function uploadReport(options) {
  const { branch, 'commit-sha': commitSHA, verbose } = options;

  const startTime = process.hrtime();

  const localReportStartTime = process.hrtime();
  const localReport = await collectLocalReport();

  if (verbose) {
    console.log(
      [chalk.blue('[i]'), `Local report prepared in ${hrToSeconds(process.hrtime(localReportStartTime))}`].join(' '),
    );
  }

  if (typeof AZURE_ACCOUNT_KEY === 'undefined') {
    console.log(
      [
        chalk.red('[e]'),
        'process.env.BUNDLESIZE_ACCOUNT_KEY is not defined, please verify Azure Pipelines settings',
      ].join(' '),
    );
    process.exit(1);
  }

  const credentials = new TablesSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_ACCOUNT_KEY);
  const client = new TableClient(
    `https://${AZURE_STORAGE_ACCOUNT}.table.core.windows.net`,
    AZURE_STORAGE_TABLE_NAME,
    credentials,
  );

  const transaction = new TableTransaction();
  const transactionStartTime = process.hrtime();

  const entitiesIterator = await client.listEntities({
    queryOptions: {
      filter: odata`PartitionKey eq ${branch}`,
    },
  });

  for await (const entity of entitiesIterator) {
    // We can't delete and create entries with the same "rowKey" in the same transaction
    // => we will delete only entries that don't present in existing report
    const shouldDelete = localReport.find(entry => createRowKey(entry) === entity.rowKey) === undefined;

    if (shouldDelete) {
      transaction.deleteEntity(/** @type {string} */ (entity.partitionKey), /** @type {string} */ (entity.rowKey));
    }
  }

  localReport.forEach(entry => {
    transaction.upsertEntity(
      {
        partitionKey: branch,
        rowKey: createRowKey(entry),

        name: entry.name,
        packageName: entry.packageName,
        path: entry.path,

        minifiedSize: entry.minifiedSize,
        gzippedSize: entry.gzippedSize,

        commitSHA,
      },
      'Replace',
    );
  });

  if (verbose) {
    console.log(
      [chalk.blue('[i]'), `A transaction prepared in ${hrToSeconds(process.hrtime(transactionStartTime))}`].join(' '),
    );
  }

  const submissionStartTime = process.hrtime();
  await client.submitTransaction(transaction.actions);

  if (verbose) {
    console.log(
      [chalk.blue('[i]'), `A transaction submitted in ${hrToSeconds(process.hrtime(submissionStartTime))}`].join(' '),
    );
    console.log(`Completed in ${hrToSeconds(process.hrtime(startTime))}`);
  }
}

// ---

exports.command = 'upload-report';
exports.desc = 'uploads local results to Azure Table Storage';
exports.builder = function (/** @type import("yargs").Argv */ yargs) {
  return yargs
    .option('branch', {
      type: 'string',
      description: 'A branch to associate a report',
      required: true,
    })
    .option('commit-sha', {
      type: 'string',
      description: 'Defines a commit sha for a report',
      required: true,
    });
};
exports.handler = uploadReport;
