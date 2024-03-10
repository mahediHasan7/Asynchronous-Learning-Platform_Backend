const db = require('../util/database');

const QuizRecord = db.sequelize.define('QuizRecord', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  subject: { type: db.Sequelize.STRING, allowNull: false },
  chapter: { type: db.Sequelize.STRING, allowNull: false },
  section: { type: db.Sequelize.STRING, allowNull: false },
  marks: { type: db.Sequelize.INTEGER, allowNull: false },
});

module.exports = QuizRecord;
