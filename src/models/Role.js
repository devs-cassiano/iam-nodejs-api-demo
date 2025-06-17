const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Role extends Model {}

Role.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'Role'
});

module.exports = Role;
