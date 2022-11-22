const setupConsumer = require('./setup-consumer')
const {
  ensureLock,
  activateLock,
  deactivateLock,
  checkLock
} = require('./lock')
const validateUUID = require('./validate-uuid')

module.exports = {
  setupConsumer,
  ensureLock,
  activateLock,
  deactivateLock,
  checkLock,
  validateUUID
}
