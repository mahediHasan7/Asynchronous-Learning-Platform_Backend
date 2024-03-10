const db = require('../util/database');

const Answer = db.sequelize.define('Answer', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = Answer;
