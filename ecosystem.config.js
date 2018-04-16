module.exports = {
    apps: [
        {
            name: "eos-api",
            script: "./api.js",
            watch: false,
            ignore_watch: ["node_modules","ssl"],
            exec_mode: "cluster"
        },
        {
            name: "eos-governor",
            script: "./governor.js",
            watch: false,
            exec_mode: "fork",
            ignore_watch: ["node_modules","ssl"],
            listen_timeout: 20000,
            kill_timeout: 15000
        },
        {
            name: "eos-wallet",
            script: "keosd",
            args: "--http-server-address localhost:7000"
        }
    ]
};