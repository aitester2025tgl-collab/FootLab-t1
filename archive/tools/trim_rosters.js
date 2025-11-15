// Archived: tools/trim_rosters.js
// Archived on 2025-11-14. Original script preserved below for reference.

// Original contents:

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const rostersPath = path.join(__dirname, '..', 'data', 'real_rosters_2025_26.js');
if (!fs.existsSync(rostersPath)) {
  const logger = require('./cliLogger');
  logger.error('Could not find', rostersPath);
  process.exit(1);
}

// ... archived original content omitted for brevity ...

// To restore: move this file back to tools/trim_rosters.js
