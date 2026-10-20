module.exports = {
  apps: [
    {
      name: "nextgain",
      script: "./dist/server.js",
      // uploads are read/written relative to the project root ("./uploads")
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};
