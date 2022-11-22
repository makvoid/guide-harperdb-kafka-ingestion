const kafka = require('kafka-node')

// Connect to the locally hosted broker
const KAFKA_HOST = 'broker:9092'
// Setup on the 'ingestion' topic (can be whatever you'd like)
const KAFKA_TOPIC = 'ingestion'
// Whether or not to log extra debug messages during operation
const VERBOSE_LOGGING = false
// Which attribute to use as the table's hash attribute
const HDB_HASH_ATTRIBUTE = 'id'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Setup a Kafka Consumer to a local broker and have messages save into HarperDB
 *
 * @param hdbCore hdbCore object from the routes handler
 * @param logger logger object from the routes handler
 */
const setupConsumer = async (hdbCore, logger) => {
  const consumer = new kafka.Consumer(
    new kafka.KafkaClient({ kafkaHost: KAFKA_HOST }),
    [{ topic: KAFKA_TOPIC }],
    { autoCommit: false }
  )
  if (VERBOSE_LOGGING) logger.notify('Kafka Consumer loaded!')

  consumer.on('message', async (msg) => {
    // Ensure this is only the latest message
    if (msg.highWaterOffset - msg.offset !== 1) return

    // Parse incoming message as JSON
    try {
      if (VERBOSE_LOGGING) logger.notify(`Received message: ${msg.value}`)
      msg = JSON.parse(msg.value)
    } catch (e) {
      logger.error(`Unable to parse message: ${e}`)
      return
    }

    // Check if the schema needs to be created
    try {
      await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'create_schema',
          schema: msg.schema
        }
      })
      if (VERBOSE_LOGGING) logger.notify('Finished making Schema!')
    } catch (_) {
      if (VERBOSE_LOGGING) logger.notify('Schema already exists.')
    }

    // Check if the table needs to be created
    try {
      await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'create_table',
          schema: msg.schema,
          table: msg.table,
          hash_attribute: HDB_HASH_ATTRIBUTE
        }
      })
      if (VERBOSE_LOGGING) logger.notify('Finished making table!')
    } catch (_) {
      if (VERBOSE_LOGGING) logger.notify('Table already exists.')
    }

    await sleep(500)

    // Upsert the record
    let result
    try {
      result = await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'upsert',
          schema: msg.schema,
          table: msg.table,
          records: msg.records
        }
      })
      if (VERBOSE_LOGGING) logger.notify('Finished making record!')
    } catch (e) {
      logger.error(`Unable to upsert record: ${e}`)
      return
    }

    if (VERBOSE_LOGGING) logger.notify(`Inserted ${result.upserted_hashes.length} record(s) into HarperDB.`)
  })
}

module.exports = setupConsumer
