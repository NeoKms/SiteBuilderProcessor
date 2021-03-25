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
    logger.info('toDataProcessor: ',json);
        try {
        logger.info(`its ${json.type}`)
        const site_id = json.site_id
        const domain = json.domain || 'none'
        const time = Date.now()
        const k8s_name = `k8s_${time}.yaml`
        if (json.type === 'deploy' || json.type === 'delete') {
            let k8s = fs.readFileSync('./src/k8s/k8s-builder.yaml','utf-8')
            fs.writeFileSync(
                './src/k8s/'+k8s_name,
                k8s
                    .replace(/__SITE_ID__/g,site_id)
                    .replace(/__SITE_DOMAIN__/g,domain)
                    .replace(/__VERSION__/g,k8s_name)
            )
            let type = json.type === 'deploy' ? 'apply' : 'delete'
            let res = await execPromise(`kubectl ${type} -f /var/www/SiteBuilderProcessor/src/k8s/${k8s_name}`)
                .then( result =>  ioConnection.getConnection())
                .then(ioClient => {
                    if (json.type === 'delete') {
                        ioClient.sendToBuilder({
                            site_id,
                            status: 'deleted',
                            error: 'Сайт снят с публикации'
                        })
                    }
                })
                .catch(async err => {
                    await execPromise(`rm /var/SiteBuilderProcessor/src/k8s/${k8s_name}`).catch(err=>err)
                    throw err
                })
            logger.debug(res)
        } else if (json.type === 'update') {
            await execPromise(`kubectl exec -i $(kubectl get po -n site-builder-${site_id}| grep reporter| awk '{print $1}') -- php -f /var/www/build.php`)
                .then(resexec => {
                    logger.debug(resexec)
                    return ioConnection.getConnection()
                })
                .then( ioClient => ioClient.sendToBuilder({
                    site_id,
                    status: 'success',
                    error: 'Сайт в процессе обновления'
                }))
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

async function toBuilder(msg, data) {
    let json = JSON.parse(msg.content.toString('utf8'));
    logger.info('toBuilder: ',json);
    try {
        await ioConnection.getConnection()
            .then( ioClient => {
                ioClient.sendToBuilder(json)
            })
    } catch (e) {
        logger.error(e)
        return this.nack(msg);
    }
    return this.ack(msg);
}

async function run() {
    let res1 = await execPromise(`kubectl config set-cluster k8s --server=${config.KUBER.URL} --insecure-skip-tls-verify=true`)
    let res2 = await execPromise(`kubectl config set-credentials admin --token=${config.KUBER.TOKEN}`)
    let res3 = await execPromise("kubectl config set-context default --cluster=k8s --user=admin")
    let res4 = await execPromise("kubectl config use-context default")
    logger.info(res1,res2,res3,res4)
    rabbitmq.createReader('dataProcessor', toDataProcessor);
    rabbitmq.createReader('builder',toBuilder)
}

run()
