# eos-node-governor
A process manager and api proxy for EOS.IO nodes

## Dependencies

### Node.js
```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2 (optional, but recommended)
```
sudo npm install pm2 -g
```

## Setup

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

### Autostart on boot
```
sudo pm2 startup
```
