const config = require('../config');
const logger = require('./logger');
const rabbitmq = require('./rabbit');
const { exec } = require("child_process");
const fs = require('fs');
const ioConnection = require('./websocket');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function toDataProcessor(msg, data) {
    let json = JSON.parse(msg.content.toString('utf8'));
    logger.info('toDataProcessor: ', json);
    try {
        logger.info(`its ${json.type}`)
        const site_id = json.site_id
        const domain = json.domain || 'none'
        const time = Date.now()
        const k8s_name = `k8s_${time}.yaml`
        let domainID = domain.split('.')[0].substr(1,1)
        if (domain==='none') {
            domainID = '8099'
        }
        let k8s = fs.readFileSync('./src/k8s/site_template.yml', 'utf-8')
        fs.writeFileSync(
            './src/k8s/' + k8s_name,
            k8s
                .replace(/__SITE_ID__/g, site_id)
                .replace(/__PORT__/g, domainID)
        )
        if (json.type === 'deploy' || json.type === 'delete') {
            let type = json.type === 'deploy' ? 'up -d' : 'down'
            let res = await execPromise(`docker-compose -f /var/SiteBuilderProcessor/src/k8s/${k8s_name} ${type}`)
                .then(result => ioConnection.getConnection())
                .then(ioClient => {
                    if (json.type === 'delete') {
                        ioClient.sendToBuilder({
                            site_id,
                            status: 'deleted',
                            error: 'Сайт снят с публикации'
                        })
                    } else {
                        return execPromise(`docker exec -i site_${site_id} bash -c 'sh /var/www/build.sh'`)
                    }
                })
            logger.debug(res)
        } else if (json.type === 'update') {
            ioConnection.getConnection()
                .then(ioClient => ioClient.sendToBuilder({
                    site_id,
                    status: 'update',
                    text: 'Сайт в процессе обновления'
                }))
                .then(() => execPromise(`docker exec -i site_${site_id} bash -c 'sh /var/www/build.sh'`))
                .then(resexec => logger.debug(resexec))
        }
        await execPromise(`rm /var/processor/src/k8s/${k8s_name}`).catch(err => err)
    } catch (e) {
        logger.error(e)
        return this.nack(msg);
    }
    return this.ack(msg);
}
function execPromise(cmd) {
    return new Promise(function (resolve, reject) {
        exec(cmd, function (err, stdout) {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
}

async function toBuilder(msg, data) {
    let json = JSON.parse(msg.content.toString('utf8'));
    logger.info('toBuilder: ', json);
    try {
        await ioConnection.getConnection()
            .then(ioClient => {
                ioClient.sendToBuilder(json)
            })
    } catch (e) {
        logger.error(e)
        return this.nack(msg);
    }
    return this.ack(msg);
}

async function run() {
    rabbitmq.createReader('dataProcessor', toDataProcessor);
    rabbitmq.createReader('builder', toBuilder)
}

run()
