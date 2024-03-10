const db = require('../util/database');

const Favorite = db.sequelize.define('Favorite');

module.exports = Favorite;
