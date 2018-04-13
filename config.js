default_config = {
    api_port: 8887,
    control_port: 8001,
    admin_user: 'admin',
    admin_pass: 'password',
    binary_path: '/home/ubuntu/eos/build/programs/nodeos',
    nodeos_http_port: 8005,
    data_path: '/home/ubuntu/.local/share/eosio/nodeos/data',
    config_path: '/home/ubuntu/.local/share/eosio/nodeos/config',
    log_dir: '/home/ubuntu/eos_logs',
    enable_stale_prod: false
};

module.exports = {
    default_config
};