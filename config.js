const env = {}

env.staging = {
  port: 3000,
  envName: 'staging',
}

env.production = {
  port: 5000,
  envName: 'production',
}

const currentEnv = !!process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : ''

const envToExport = currentEnv in env ? env[currentEnv] : env.staging

module.exports = envToExport