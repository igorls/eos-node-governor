# eos-node-governor
A process manager and api proxy for EOS.IO nodes

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

## 3. API Usage

By default all default API's with exception of Net API (net_api_plugin) will be exposed to port __8000__, as defined by __default_config.api_port__

Please open this port on your firewall instead of the nodeos http port

Test by pointing your browser to: `http://your-node-address:8000/v1/chain/get_info`

## 4. Remote Admin Panel

Access the control panel at: `http://your-node-address:8001/control`

Live server logs are available at: `http://your-node-address:8001/logs`
