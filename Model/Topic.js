const db = require('../util/database');

const Topic = db.sequelize.define('Topic', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: { type: db.Sequelize.TEXT, allowNull: false },
  description: { type: db.Sequelize.TEXT('long'), allowNull: true },
  lectureNote: { type: db.Sequelize.STRING, allowNull: true },
  content: { type: db.Sequelize.TEXT('long'), allowNull: true },
});

module.exports = Topic;
