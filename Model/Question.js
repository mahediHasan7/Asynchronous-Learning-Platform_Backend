const db = require('../util/database');

const Question = db.sequelize.define('Question', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  question: { type: db.Sequelize.TEXT('long'), allowNull: false },
  option1: { type: db.Sequelize.TEXT, allowNull: false },
  option2: { type: db.Sequelize.TEXT, allowNull: false },
  option3: { type: db.Sequelize.TEXT, allowNull: false },
  option4: { type: db.Sequelize.TEXT, allowNull: false },
  answer: { type: db.Sequelize.TEXT, allowNull: false },
  solution: { type: db.Sequelize.TEXT, allowNull: true },
});

module.exports = Question;
