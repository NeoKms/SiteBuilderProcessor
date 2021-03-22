const config = require('../config');
const logger = require('./logger');
const rabbitmq = require('./rabbit');
const { exec } = require("child_process");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


async function toDataProcessor(msg, data) {
    let json = JSON.parse(msg.content.toString('utf8'));
    logger.info(json);
    try {
        if (json.type === 'deploy') {
            console.log('its deploy')
            let res = await execPromise('echo 1234')
            console.log(res)
        } else if (json.type === 'delete') {
            console.log('its delete')
        }
    } catch (e) {
        logger.error(e)
        return this.nack(msg);
    }
    return this.ack(msg);
}
function execPromise(cmd) {
    return new Promise(function(resolve, reject) {
        exec(cmd, function(err, stdout) {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
}
rabbitmq.createReader('dataProcessor', toDataProcessor);
