const sortComparedReport = require('./sortComparedReport');

describe('sortComparedReport', () => {
  it('sort a report by "packageName" & "path', () => {
    /** @type {import('../commands/compareReports').DiffForEntry} */
    const diff = {
      empty: true,
      gzip: { delta: 0, percent: '0%' },
      minified: { delta: 0, percent: '0%' },
    };

    /** @type {import('../commands/compareReports').ComparedReport} */
    const report = [
      { packageName: 'bcd', name: 'BCD-B', path: 'bcd-b.js', minifiedSize: 0, gzippedSize: 0, diff },
      { packageName: 'bcd', name: 'BCD-A', path: 'bcd-a.js', minifiedSize: 0, gzippedSize: 0, diff },
      { packageName: 'abc', name: 'ABC', path: 'abc.js', minifiedSize: 0, gzippedSize: 0, diff },
    ];

    expect(sortComparedReport(report).map(({ packageName, path }) => ({ packageName, path }))).toMatchInlineSnapshot(`
      Array [
        Object {
          "packageName": "abc",
          "path": "abc.js",
        },
        Object {
          "packageName": "bcd",
          "path": "bcd-a.js",
        },
        Object {
          "packageName": "bcd",
          "path": "bcd-b.js",
        },
      ]
    `);
  });
});
