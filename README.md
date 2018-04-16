<h1 align="center">
  <br>
  EOS.IO Node Governor
  <br>
</h1>
<h3 align="center">
A process manager, control panel and api proxy for EOS.IO nodes
</h3>

*Made with :hearts: by [EOS Rio](https://steemit.com/@eosrio)*

## 1. Dependencies

### Node.js
```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2
```
sudo npm install pm2 -g
```

EOS.IO (*nodeos*) is required and expected to be installed in `/home/ubuntu/eos/build/programs/nodeos`, if you installed in a different directory, please set the path to *nodeos* in the `config.js` file before starting.

## 2. Setup

```
git clone https://github.com/igorls/eos-node-governor.git
cd eos-node-governor
npm install
```

Frontend will be automatically served from the precompiled files in `frontend/dist`  
If you need to rebuild run:
```
cd frontend
npm install
npm run build
```

### 2.1 nodeos config.ini

Close external access to the http api by setting `http-server-address = 127.0.0.1:YOUR_PORT`

## 3. Configuration steps on *config.js* file

### 3.1 Check ports

- `api_port` -> public HTTP port for end users
- `nodeos_http_port` -> internal HTTP port defined on nodeos config.ini (http-server-address)
- `secure_control_port` -> https port for remote control panel
- `control_port` -> unsecured control panel port, it's ignored if `secure_control_port` is not 0

### 3.2 Set credentials

Define `admin_user` and `admin_pass`

### 3.3 Set paths

- `binary_path` -> path where the *nodeos* binary resides
- `data_path` -> path to *store blocks* and *shared_mem* folders
- `config_path` -> folder where your config.ini file is located
- `log_dir` -> folder for nodeos logs
- `log_name` -> base name for the live log file

*If a crash happens the governor will create a backup of the current log file suffixed by the crash time*

### 3.4 SSL Ceritificate

The governor will automatically generate a self-signed certificate based on your machine public ip address, if you have a custom domain or already got a certificate, please set the full paths:

- `ssl_key` -> path to the .key file
- `ssl_cert` -> path to the .cert file

Leave them blank if you are fine with the self-signed certificate (it will show security warnings on the browser upon access, but you are still secured)

## 4. First run & PM2 setup
*Check configurations on `config.js` file before starting*  

First start with:
```
pm2 start ecosystem.config.js
```

To stop use:
```
pm2 stop ecosystem.config.js
```

To control only the eos-governor process use:
```
pm2 stop eos-governor
pm2 start eos-governor
pm2 reload eos-governor
```
avoid using `pm2 restart ...` since it will corrupt your chain data!

### Autostart on boot
```
sudo pm2 startup
```

## 4. API Usage

By default all API's with exception of Net API (net_api_plugin) will be exposed to port __8888__, as defined by __default_config.api_port__

Please open this port on your firewall instead of the nodeos http port

Test by pointing your browser to: `http://your-node-address:8888/v1/chain/get_info`

## 5. Remote Admin Panel

Access the control panel at: `https://your-node-address:8443/` and login with the defined user and password
