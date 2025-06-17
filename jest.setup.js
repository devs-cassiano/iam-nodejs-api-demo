process.env.NODE_ENV = 'test';
require('dotenv').config();
const sequelize = require('./src/config/sequelize');

afterAll(async () => {
  await sequelize.close();
});
