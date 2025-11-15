/* eslint-disable no-console, no-unused-vars */
const Persistence = require('./src/core/persistence');

const logger = require('./testLogger').getLogger();

function assert(cond, msg) {
  if (!cond) {
    logger.error('FAIL:', msg);
    process.exit(2);
  }
}

logger.info(
  'Loaded Persistence:',
  typeof Persistence.saveSnapshot === 'function' ? 'ok' : 'missing'
);

// small snapshot should save (return true)
const small = { now: Date.now(), foo: 'bar' };
const savedSmall = Persistence.saveSnapshot(small);
logger.info('saveSnapshot(small) =>', savedSmall);
assert(savedSmall === true, 'Expected small snapshot to be saved');

// large snapshot should be rejected due to size guard
const hugeStr = 'x'.repeat(700 * 1024);
const big = { big: hugeStr };
const savedBig = Persistence.saveSnapshot(big);
logger.info('saveSnapshot(big) =>', savedBig);
assert(savedBig === false, 'Expected large snapshot to be rejected by size guard');

logger.info('persistence_test: PASS');
