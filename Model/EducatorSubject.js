const db = require('../util/database');

const EducatorSubject = db.sequelize.define('EducatorSubject');

module.exports = EducatorSubject;
