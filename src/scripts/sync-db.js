const path = require('path');
const sequelize = require(path.resolve(__dirname, '../config/sequelize'));
const models = require(path.resolve(__dirname, '../models'));

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database synced!');
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
})();
