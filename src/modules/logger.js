const log4js = require('log4js');

log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[[%d] %p %m%]',
            },
        },
    },
    categories: {default: {appenders: ['console'], level: 'all'}},
});

const logger = log4js.getLogger();

module.exports = logger;
