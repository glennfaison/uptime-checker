const env = {}

env.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'This is a secret'
}

env.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'This is a secret'
}

const currentEnv = !!process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : ''

const envToExport = currentEnv in env ? env[currentEnv] : env.staging

module.exports = envToExport