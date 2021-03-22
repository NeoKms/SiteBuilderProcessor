const config = require('./src/config');
const logger = require('./src/modules/logger');
const amqp = require('./src/modules/rabbitController')

logger.info('processor: start');
