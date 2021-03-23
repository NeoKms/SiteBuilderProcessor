const io = require('socket.io-client');
const config = require('../config');
const logger = require('./logger');
const auth = require('./cookie');

let socket = null;

const getConnection = async function () {
    if (socket) return socket;
    const sessionCookie = await auth();
    socket = io(config.WEBSOCKER_HOST, {transports: ['websocket'], extraHeaders: {cookie: sessionCookie}});

    socket.on('connect', (data) => {
        logger.debug('connect to ' + config.WEBSOCKER_HOST + ' success');
    });
    socket.on('disconnect', () => {
        logger.info('socket disconnect');
    });
    socket.sendToBuilder = function (data) {
        socket.emit('builder', data);
    };
    return socket;
};

module.exports.getConnection = getConnection;
