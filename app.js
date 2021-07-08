const config = require('./src/config');
const logger = require('./src/modules/logger');
if (config.IS_COMPOSE) {
    const amqp = require('./src/modules/rabbitControllerCompose')
} else {
    const amqp = require('./src/modules/rabbitController')
}


logger.info('processor: start');
