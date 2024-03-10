// const database = require('mysql2');

// const pool = database.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'imac6565',
//   database: 'fullStack-placeApp',
// });

// module.exports = pool.promise();

const Sequelize = require('sequelize').Sequelize;
const op = Sequelize.Op;
const db = {};

const sequelize = new Sequelize('ALP', 'root', 'imac6565', {
  logging: false,
  dialect: 'mysql',
  host: 'localhost',
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
