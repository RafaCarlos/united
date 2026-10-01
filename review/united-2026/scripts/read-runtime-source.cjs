/* Run the same behavior tests against editable sources or an exported delivery.
 * An explicit delivery path must contain the script; never silently fall back.
 */
const {readFileSync} = require('node:fs');
const path = require('node:path');

module.exports = function readRuntimeSource(filename) {
  const directory = process.env.UNITED_DELIVERY_SITE || path.join(__dirname, '../src');
  return readFileSync(path.resolve(directory, filename), 'utf8');
};
