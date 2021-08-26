const io = require('socket.io-client');
const config = require('../config');
const logger = require('./logger');
const auth = require('./cookie');

let socket = null;

const getConnection = async function () {
    if (socket) return socket;
    const sessionCookie = await auth(true);
    socket = io(config.WEBSOCKET_HOST, {transports: ['websocket'], extraHeaders: {cookie: sessionCookie}});

    socket.on('connect', (data) => {
        logger.debug('connect to ' + config.WEBSOCKET_HOST + ' success');
    });
    socket.on('disconnect', () => {
        logger.info('socket disconnect');
        socket.close();
        socket = null
        getConnection()
    });
    socket.sendToBuilder = function (data) {
        socket.emit('builder', data);
    };
    return socket;
};

module.exports.getConnection = getConnection;
