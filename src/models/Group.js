const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Group extends Model {}

Group.init({
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
  modelName: 'Group'
});

module.exports = Group;
