module.exports = {
    apps: [
        {
            name: "eos-api",
            script: "./api.js",
            watch: true,
            exec_mode: "cluster"
        },
        {
            name: "eos-governor",
            script: "./governor.js",
            watch: true,
            instances: 1,
            kill_timeout : 3000
        }
    ]
};
