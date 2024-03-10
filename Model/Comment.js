const db = require('../util/database');

const Comment = db.sequelize.define('Comment', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  commentText: { type: db.Sequelize.TEXT('long'), allowNull: false },
  userName: { type: db.Sequelize.TEXT, allowNull: false },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  userRole: { type: db.Sequelize.STRING, allowNull: false },
});

module.exports = Comment;
