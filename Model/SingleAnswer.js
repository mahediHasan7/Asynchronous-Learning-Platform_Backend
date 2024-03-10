const db = require('../util/database');

const SingleAnswer = db.sequelize.define('SingleAnswer', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  answer: { type: db.Sequelize.TEXT, allowNull: false },
});

module.exports = SingleAnswer;
