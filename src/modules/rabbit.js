const amqp = require('amqp-connection-manager');
const config = require('../config');
const logger = require('./logger');

const connection = amqp.connect([config.RABBIT.URL]);
connection.on('connect', () => console.log('RabbitMQ Connected!'));
connection.on('disconnect', err => console.log('RabbitMQ  Disconnected.', err));

function createWriter(name) {
    const writer = connection.createChannel({
        json: true,
        setup(channel) {
            return channel.assertQueue(name, { durable: true });
        },
    });
    return (msg) => {
        try {
            writer.sendToQueue(name, msg);
        } catch (error) {
            logger.error(new Error(`sendToQueue:${name}: Message was rejected...`));
        }
    };
}

function createReader(name, callback) {
    const channelReader = connection.createChannel({
        json: true,
        setup(channel) {
            return Promise.all([
                channel.assertQueue(name, { durable: true }),
                channel.prefetch(1),
                channel.consume(name, callback.bind(channelReader)),
            ]);
        },
    });
    channelReader.waitForConnect()
        .then(() => {
            logger.info(`channelReader:${name}: Listening for messages`);
        });
    return channelReader;
}

module.exports = {
    createWriter,
    createReader,
};
