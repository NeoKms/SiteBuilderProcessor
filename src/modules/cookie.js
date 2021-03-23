const axios = require('axios');
const cookie = require('cookie');
const config = require('../config/index');
const logger = require('./logger');

async function getSessionCookie(renew = false) {
    if (global.coockieAuth!==undefined && renew===false) {
        return global.coockieAuth;
    }
    return axios({
        method: 'post',
        url: `${config.API.HOST}auth/login`,
        data: {
            username: config.API.LOGIN,
            password: config.API.PASS
        },
        withCredentials: true
    }).then( loginCookie => {
        if (loginCookie.headers['set-cookie'] && loginCookie.headers['set-cookie'].length < 1) {
            logger.error(new Error(`login error to ${config.API.HOST}/auth/login = NO COOKIES!`));
            return false;
        }
        const cookies = cookie.parse(loginCookie.headers['set-cookie'][0]);

        global.coockieAuth = `connect.sid=${cookies['connect.sid']}`

        return `connect.sid=${cookies['connect.sid']}`;
    })
}

module.exports = getSessionCookie
