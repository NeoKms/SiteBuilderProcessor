module.exports = {
    apps : [{
        error_file : "/var/log/pm2_err.log",
        out_file : "/var/log/pm2_out.log",
        name: "app",
        script: "npm",
        watch: false,
        args: "start",
        cwd: "/var/SiteBuilderProcessor/",
        ignore_watch: [
            "package-lock.json",
            "package.json",
            "node_modules",
            ".git",
            ".*"
        ]
    }]
}
