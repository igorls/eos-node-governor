const conf = require('./config.js').default_config;
const express = require('express');
const cors = require('cors');
const rp = require('request-promise');
const fs = require("fs");
const os = require('os');
const {COPYFILE_EXCL} = fs.constants;
const {spawn} = require('child_process');
const pm2 = require('pm2');
const app = express();
const http = require("http");
const path = require('path');
const https = require('https');
const bodyParser = require('body-parser');
const server = http.createServer(app);

let secureServer = null;
const ssl_folder = path.resolve(__dirname, 'ssl');
let keyPath = ssl_folder + '/localhost.key';
let certPath = ssl_folder + '/localhost.cert';
let producerName = '';
let initialPeers = [];
if (producerName === '') {
    if (fs.existsSync(conf.config_path + '/config.ini')) {
        fs.readFile(conf.config_path + '/config.ini', 'utf8', (err, data) => {
            if (err) throw err;
            const data_str = Buffer.from(data).toString();
            const configArray = data_str.split('\n');
            configArray.forEach((line) => {
                if (line.match(/^producer-name/g)) {
                    producerName = line.split("=")[1].trim();
                }
                if (line.match(/^p2p-peer-address/g)) {
                    initialPeers.push(line.split("=")[1].trim())
                }
            });
            console.log("Producer name: " + producerName);
        });
    }
}

if (conf.ssl_key !== '') {
    keyPath = conf.ssl_key;
}
if (conf.ssl_cert !== '') {
    certPath = conf.ssl_cert;
}
if (conf.secure_control_port > 0) {
    console.log('HTTPS Port: ' + conf.secure_control_port);
    if (!fs.existsSync(ssl_folder)) {
        fs.mkdirSync(ssl_folder);
    }
    if (!fs.existsSync(keyPath)) {
        console.log('Generating key...');
        const keygen_proc = spawn('openssl', ['genrsa', '-out', keyPath, '2048'], {detached: true});
        keygen_proc.on('error', (err) => {
            console.log('Failed to start subprocess.');
            console.log(err);
        });
        keygen_proc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        keygen_proc.on('close', (code) => {
            console.log('SSL key generated! ' + `child process exited with code ${code}`);
            genCert(conf.server_domain);
        });
    }
    if (!fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        genCert(conf.server_domain);
    }
    if (fs.existsSync(certPath) || fs.existsSync(keyPath)) {
        initHTTPS(keyPath, certPath);
    }
} else {
    initHTTP();
}

function genCert(extIP) {
    console.log('Generating certificate...');
    if (extIP === '') {
        console.log('verifying external ip...');
        rp({uri: 'http://myexternalip.com/raw'}).then((response) => {
            spawnCertGen(response);
        });
    } else {
        spawnCertGen(extIP);
    }
}

function spawnCertGen(extIP) {
    const args = ['req', '-new', '-x509', '-key', keyPath, '-out', certPath, '-days', '3650', '-subj', '/CN=' + extIP];
    const certgen_proc = spawn('openssl', args, {detached: true});
    certgen_proc.on('error', (err) => {
        console.log('Failed to start subprocess.');
        console.log(err);
    });
    certgen_proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    certgen_proc.on('close', (code) => {
        console.log('SSL certificate generated! ' + `child process exited with code ${code}`);
        initHTTPS(keyPath, certPath);
    });
}

let io = null;

function initHTTPS(key, cert) {
    if (!secureServer && fs.existsSync(cert) && fs.existsSync(key)) {
        const ssl_options = {
            key: fs.readFileSync(key),
            cert: fs.readFileSync(cert),
            requestCert: false,
            rejectUnauthorized: false
        };
        secureServer = https.createServer(ssl_options, app);
        secureServer.listen(conf.secure_control_port, function () {
            console.log('Secure express server listening on port ' + conf.secure_control_port);
            socketInit(secureServer);
            init();
        });
    } else {
        console.log('Error starting https server, please check key and certificate!');
    }
}

function initHTTP() {
    server.listen(conf.control_port, () => {
        console.log('governor process listening on port ' + conf.control_port);
        process.send('ready');
        socketInit(server);
        init();
    });
}

function socketInit(srv) {
    io = require('socket.io')(srv);
    io.on('connection', function (socket) {
        socket.on('join', function (data) {
            console.log("Request to join room: " + data['room']);
            socket.join(data['room']);
        });
        socket.on('leave', function (data) {
            console.log("Request to leave room: " + data['room']);
            socket.leave(data['room'], function (resp) {
                socket.emit(resp);
            });
        });
    });
}

function shutdown() {
    pm2.stop('eos-api', (err) => {
        console.log(err);
    });
    pm2.stop('eos-governor', (err) => {
        console.log(err);
    });
}

let child_proc = null;
const nodeos = conf.binary_path + '/nodeos';
let serverStatus = false;
let currentInfo = null;
let restartCount = 0;
let autoRestart = true;
let resyncChain = false;
let governorIntervalId = null;

function backupLogFile() {
    fs.copyFileSync(conf.log_dir + '/' + conf.log_name, conf.log_dir + '/' + conf.log_name + '-' + (new Date().getTime()) + '.log', COPYFILE_EXCL);
}

function restartNode() {
    restartCount++;
    console.log('Staring EOS.IO...');
    if (!fs.existsSync(conf.log_dir)) {
        fs.mkdirSync(conf.log_dir);
    }
    const logStream = fs.createWriteStream(conf.log_dir + '/' + conf.log_name, {flags: 'w'});
    const args = ['--enable-stale-production', conf.enable_stale_prod, '--data-dir', conf.data_path, '--config-dir', conf.config_path];
    if (resyncChain) {
        args.push('--resync');
    }
    child_proc = spawn(nodeos, args, {detached: true});
    restarting = false;
    child_proc.on('error', (err) => {
        console.log('Failed to start subprocess.');
        console.log(err);
    });
    child_proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    child_proc.stderr.on('data', (data) => {
        io.in('logs').emit('log', data);
    });
    child_proc.stderr.pipe(logStream);
    child_proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        child_proc = null;
    });
}

let currentHeadBlock = 0;
let lastHeadBlock = 0;
let idleFor = 0;
let lastProducedBlock = 0;

function init() {
    if (!fs.existsSync(nodeos)) {
        console.log('nodeos not found in [' + conf.binary_path + ']');
        shutdown();
    } else if (!fs.existsSync(conf.config_path + '/config.ini')) {
        console.log('config.ini not found in [' + conf.config_path + ']');
        shutdown();
    } else {
        restartNode();
    }
    startBlockStreamer();
}

function checkIdleChain() {
    if (lastHeadBlock && currentHeadBlock === lastHeadBlock) {
        idleFor += 1;
        // Restart if a new block is not produced in 60 seconds.
        if (idleFor > 120) {
            safeRestart();
        }
    } else {
        idleFor = 0;
        lastHeadBlock = currentHeadBlock;
    }
}

let testUrl = 'http://localhost:' + conf.nodeos_http_port + '/v1/chain/get_info';
const activeProducers = {};

function startBlockStreamer() {
    if (!governorIntervalId) {
        governorIntervalId = setInterval(() => {
            http.get(testUrl, (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    currentInfo = JSON.parse(data);
                    currentHeadBlock = parseInt(currentInfo['head_block_num']);
                    activeProducers[currentInfo['head_block_producer']] = currentInfo['head_block_time'];
                    if (currentInfo['head_block_producer'] === producerName) {
                        lastProducedBlock = currentHeadBlock;
                        console.log(producerName + " produced at height " + currentHeadBlock + " - " + currentInfo['head_block_time']);
                    }
                    io.in('blocks').emit('block', {
                        head_block_num: currentHeadBlock,
                        last_produced: lastProducedBlock,
                        last_irreversible_block_num: currentInfo['last_irreversible_block_num'],
                        head_block_time: currentInfo['head_block_time'],
                        head_producer: currentInfo['head_block_producer'],
                        your_producer: producerName
                    });
                    serverStatus = currentHeadBlock > 0;
                    checkIdleChain();
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                serverStatus = false;
                safeRestart();
            });
        }, 500);
    }
}

// Restart if autoRestart is set to true, should be renamed to something more indicative
let restarting = false;

function safeRestart() {
    if (!restarting) {
        if (autoRestart) {
            restarting = true;
            backupLogFile();
            restartNode();
        }
    }
}

app.use(cors());
app.use(bodyParser.json());

authRequired = function (req, res, next) {
    if (req.body.user === conf.admin_user && req.body.pass === conf.admin_pass) {
        next();
    } else {
        res.status(401).send('access denied!');
    }
};

app.get('/current', (req, res) => {
    res.json(currentInfo);
});

app.get('/activeproducers', (req, res) => {
    res.json(activeProducers);
});

app.get('/initialpeers', (req, res) => {
    res.json(initialPeers);
});

app.get('/peers', (req, res) => {
    const opts = {
        uri: 'http://localhost:' + conf.nodeos_http_port + '/v1/net/connections',
        method: 'GET',
        timeout: 1000,
        json: true
    };
    rp(opts).then((response) => {
        res.send(response);
    }).catch((err) => {
        res.send(err);
    });
});

app.post('/login', authRequired, (req, res) => {
    res.json({
        status: 'OK',
        apiPort: conf.api_port
    });
});

app.post('/start', authRequired, (req, res) => {
    if (!child_proc) {
        restartNode();
        setTimeout(() => {
            startBlockStreamer();
        }, 500);
        autoRestart = true;
        res.json({
            status: 'OK',
            message: 'nodeos started'
        });
    } else {
        res.json({
            status: 'FAIL',
            message: 'nodeos was already running!'
        });
    }
});

app.post('/stop', authRequired, (req, res) => {
    child_proc.kill(15);
    autoRestart = false;
    if (governorIntervalId) {
        clearInterval(governorIntervalId);
        governorIntervalId = null;
    }
    res.json({
        status: 'OK',
        message: 'nodeos stopped'
    });
});

app.post('/reload', authRequired, (req, res) => {
    autoRestart = false;
    child_proc.kill(15);
    setTimeout(() => {
        autoRestart = true;
        res.json({
            status: 'OK',
            message: 'nodeos reloaded'
        });
    }, 1000);
});

app.get('/stats', function (req, res) {
    res.json({
        totalram: os.totalmem(),
        freeram: os.freemem(),
        cores: os.cpus(),
        cpu: os.loadavg()
    });
});

app.use('/', express.static('frontend/dist'));

app.all('*', function (req, res) {
    res.status(200).sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

process.on('SIGINT', function () {
    if (child_proc) {
        child_proc.on('close', () => {
            process.exit(0);
        });
        child_proc.kill();
    } else {
        process.exit(0);
    }
});
