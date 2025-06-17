const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Policy extends Model {}

Policy.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  document: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'Policy'
});

module.exports = Policy;
