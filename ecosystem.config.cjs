module.exports = {
  apps: [
    {
      name: "fund-app",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000 --hostname 0.0.0.0",
      cwd: "C:/www/fund-screenshot-analyzer",
      interpreter: "node",
      env: {
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
        NODE_OPTIONS: "--max-old-space-size=1536",
      },
    },
  ],
};
