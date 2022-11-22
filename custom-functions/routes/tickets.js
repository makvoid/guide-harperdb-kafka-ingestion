'use strict'

const validateUUID = require('../helpers/validateUUID')

module.exports = async (server, { hdbCore, logger }) => {
  server.route({
    url: '/order/:orderId',
    method: 'GET',
    handler: async (request) => {
      if (!validateUUID(request.params.orderId)) {
        return {
          error: 'Invalid Order ID format'
        }
      }

      request.body = {
        operation: 'sql',
        sql: `SELECT * FROM acme.orders WHERE id = '${request.params.orderId}'`
      }
      const result = await hdbCore.requestWithoutAuthentication(request)

      if (result.length) {
        return result[0]
      } else {
        return {
          error: 'Invalid Order ID provided - please double-check your invoice.'
        }
      }
    }
  })
}
