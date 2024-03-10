const db = require('../util/database');

const Subject = db.sequelize.define('Subject', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: db.Sequelize.STRING, allowNull: false },
  code: { type: db.Sequelize.STRING, allowNull: false },
  grade: { type: db.Sequelize.STRING, allowNull: false },
  description: { type: db.Sequelize.TEXT('long'), allowNull: false },
  educator: { type: db.Sequelize.STRING, allowNull: true },
  enrollment: { type: db.Sequelize.INTEGER, allowNull: true },
});

module.exports = Subject;
