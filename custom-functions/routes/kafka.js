'use strict'

const {
  setupConsumer,
  activateLock,
  checkLock
} = require('../helpers')

// Path to store the lockfile at
const LOCK_PATH = '/tmp/kafka.lock'

module.exports = async (_, { hdbCore, logger }) => {
  // Setup Kafka consumer client
  const consumerStarted = await checkLock(LOCK_PATH)
  if (!consumerStarted) {
    await activateLock(LOCK_PATH)
    await setupConsumer(hdbCore, logger)
  }
}
