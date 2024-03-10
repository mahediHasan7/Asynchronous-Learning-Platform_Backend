const db = require('../util/database');

const Quiz = db.sequelize.define('Quiz', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = Quiz;
