module.exports = {
  apps: [{
    name: "Himatika",
    port: 8080,
    exec_mode: 'cluster',
    instances: 'max',
    script: "./.output/server/index.mjs"
  }]
}
