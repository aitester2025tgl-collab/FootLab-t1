// This script was renamed to `check_spanish_coverage.js` to avoid league-named filenames.
// Kept as a small redirect for compatibility.
const logger = require('./cliLogger');
logger.info(
  'Note: tools/check_laliga.js has been renamed to tools/check_spanish_coverage.js. Running the renamed script...'
);
require('./check_spanish_coverage.js');
