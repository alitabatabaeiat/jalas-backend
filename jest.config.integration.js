const config = require('./jest.config');
config.testMatch = ['**/?(*.)+(itest).ts'];

module.exports = config;