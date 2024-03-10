const db = require('../util/database');

const Chapter = db.sequelize.define('Chapter', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: db.Sequelize.STRING, allowNull: false },
  totalSections: { type: db.Sequelize.INTEGER, allowNull: true },
});

module.exports = Chapter;
