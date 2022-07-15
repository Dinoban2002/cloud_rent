const { Sequelize } = require('sequelize');
// Option 2: Passing parameters separately (other dialects)
module.exports = new Sequelize(
    `${process.env.db_name}`, 
    `${process.env.db_user}`,
    `${process.env.db_pwd}`, 
    {
        host: `${process.env.db_host}`,
        dialect: 'mariadb'
    }
);