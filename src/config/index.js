const {env} = process;

const PRODUCTION = String(env.PRODUCTION || false).toLowerCase() == "true"

//only dev//
if (!PRODUCTION) {
    const dotenv = require('dotenv');
    dotenv.config();
}
//

const PORT = env.PORT || 3001

const RABBIT = {
    URL: `amqp://${env.RABBIT_USER}@${env.RABBIT_HOST}`,
    QUERIES: {},
};

module.exports = {
    PORT,
    RABBIT,
    PRODUCTION,
};
