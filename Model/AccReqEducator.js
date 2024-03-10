const db = require('../util/database');

const AccReqEducator = db.sequelize.define('AccReqEducator', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  role: { type: db.Sequelize.STRING, allowNull: false },
  name: { type: db.Sequelize.STRING, allowNull: false },
  // educatorId: { type: db.Sequelize.STRING, allowNull: false },
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
  approval: { type: db.Sequelize.STRING, allowNull: true },
});

module.exports = AccReqEducator;
