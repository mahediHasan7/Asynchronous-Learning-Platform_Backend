const db = require('../util/database');

const StudentSubject = db.sequelize.define('StudentSubject');

module.exports = StudentSubject;
