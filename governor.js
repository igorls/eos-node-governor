const conf = require('./config.js').default_config;
const express = require('express');
const rp = require('request-promise');
const fs = require("fs");
const { COPYFILE_EXCL } = fs.constants;
const {spawn} = require('child_process');
const pm2 = require('pm2');
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    socket.on('join', function (data) {
        socket.join(data.room);
    });
});

function shutdown() {
    pm2.stop('eos-api', (err) => {
        console.log(err);
    });
    pm2.stop('eos-governor', (err) => {
        console.log(err);
    });
}

let child_proc = null;
const logStream = fs.createWriteStream(conf.log_dir + '/eos.log', {flags: 'a'});
const nodeos = conf.binary_path + '/nodeos';
let serverStatus = false;
let currentInfo = null;
let restartCount = 0;
let autoRestart = true;

function backupLogFile() {
    fs.copyFileSync(conf.log_dir + '/eos.log', conf.log_dir + '/eos-' + (new Date().getTime()) + '.log', COPYFILE_EXCL);
}

function restartNode() {
    restartCount++;
    console.log('Staring EOS.IO...');
    const args = ['--enable-stale-production', conf.enable_stale_prod, '--data-dir', conf.data_path, '--config-dir', conf.config_path];
    child_proc = spawn(nodeos, args, {detached: true}, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
    });
    child_proc.on('error', (err) => {
        console.log('Failed to start subprocess.');
        console.log(err);
    });
    child_proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    child_proc.stderr.on('data', (data) => {
        // Emit to socket IO
        io.in('logs').emit('log', data);
    });
    child_proc.stderr.pipe(logStream);
    child_proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

if (!fs.existsSync(nodeos)) {
    console.log('nodeos not found in [' + conf.binary_path + ']');
    shutdown();
} else if (!fs.existsSync(conf.config_path + '/config.ini')) {
    console.log('config.ini not found in [' + conf.config_path + ']');
    shutdown();
} else {
    restartNode();
}

setInterval(() => {
    http.get('http://localhost:' + conf.nodeos_http_port + '/v1/chain/get_info', (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            currentInfo = JSON.parse(data);
            serverStatus = parseInt(currentInfo['head_block_num']) > 0;
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
        serverStatus = false;
        if (autoRestart) {
            backupLogFile();
            restartNode();
        }
    });
}, 5000);

app.get('/current', (req, res) => {
    res.json(currentInfo);
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

// app.get('/start', (req, res) => {
//     restartNode();
//     autoRestart = true;
//     res.send('nodeos started');
// });
//
// app.get('/stop', (req, res) => {
//     child_proc.kill(15);
//     autoRestart = false;
//     res.send('nodeos stoped!');
// });

// app.use('/logs', express.static('live_logger'));

app.get('/logs', function (req, res) {
    res.sendFile(__dirname + '/live_logger/index.html');
});

process.on('SIGINT', function () {
    if (child_proc) {
        child_proc.on('close', () => {
            process.exit(0);
        });
        child_proc.kill(15);
    }
});

server.listen(conf.control_port, () => {
    console.log('governor process listening on port ' + conf.control_port);
    process.send('ready');
});