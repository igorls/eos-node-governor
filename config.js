default_config = {
    api_port: 8888,
    nodeos_http_port: 8887,
    control_port: 8001,
    secure_control_port: 8443,
    admin_user: 'admin',
    admin_pass: 'password',
    ssl_key: '',
    ssl_cert: '',
    server_domain: '',
    binary_path: '/home/entropia/eos/build/programs/nodeos',
    data_path: '/home/entropia/testnets/jungle',
    config_path: '/home/entropia/testnets/jungle',
    log_dir: '/home/entropia/testnets/jungle',
    log_name: 'jungle.log',
    enable_stale_prod: false
};

module.exports = {
    default_config
};