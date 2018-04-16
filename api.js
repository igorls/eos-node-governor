const conf = require('./config.js').default_config;
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const cors = require('cors');
const app = express();
const proxy = require('http-proxy-middleware');

app.use(cors());
process.on('SIGINT', function () {
    process.exit(0);
});

// proxy middleware blocking requests to the net api
app.use(['/v1/**', '!**/net/**'], proxy({target: 'http://127.0.0.1:' + conf.nodeos_http_port, changeOrigin: true}));


app.listen(conf.api_port, () => {
    console.log('api proxy listening on port ' + conf.api_port);
    process.send('ready');
});
