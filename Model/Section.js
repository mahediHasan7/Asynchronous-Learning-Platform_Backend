const db = require('../util/database');

const Section = db.sequelize.define('Section', {
  id: {
    type: db.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: db.Sequelize.STRING, allowNull: false },
});

module.exports = Section;
