const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Permission extends Model {}

Permission.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'Permission'
});

module.exports = Permission;
