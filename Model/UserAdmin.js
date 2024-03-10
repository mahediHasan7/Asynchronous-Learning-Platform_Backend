const db = require('../util/database');

const UserAdmin = db.sequelize.define(
  'UserAdmin',
  {
    id: {
      type: db.Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: { type: db.Sequelize.STRING, allowNull: false },
    password: {
      type: db.Sequelize.STRING,
      allowNull: false,
      validate: {
        len: { args: [4, 20], msg: 'Password minimum character needed is 4' },
      },
    },
    email: {
      type: db.Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { args: true, msg: 'Email is invalid' },
      },
    },
    phone: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: { args: true, msg: 'Invalid phone number' },
        len: { args: [8, 20], msg: 'Minimum 8-digit phone number' },
      },
    },
    image: { type: db.Sequelize.STRING, allowNull: false },
    role: { type: db.Sequelize.STRING, allowNull: false },
  },
  {
    initialAutoIncrement: 100,
  }
);

module.exports = UserAdmin;
