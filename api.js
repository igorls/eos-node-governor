const conf = require('./config.js').default_config;
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const app = express();

process.on('SIGINT', function () {
    process.exit(0);
});

app.get('/', (req, res) => {
    res.send('eosio api proxy');
});

app.all('/v1/*', bodyParser.json(), (req, res) => {
    // console.log("Method " + req.method);
    // console.log('Path: ' + req.path);
    const path = req.path.split('/');
    if (path[2] !== 'net') {
        const opts = {
            uri: 'http://localhost:' + conf.nodeos_http_port + req.path,
            method: req.method,
            timeout: 1000,
        };
        if (req.method === 'POST') {
            opts['body'] = req.body;
            opts['json'] = true;
        }
        rp(opts).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.send(err);
        });
    } else {
        res.status(401).send('Access denied!');
    }
});

app.listen(conf.api_port, () => {
    console.log('api proxy listening on port ' + conf.api_port);
    process.send('ready');
});
