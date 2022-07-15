const sequelize = require("../config/database");
let md5 = require('md5');
const { Sequelize, DataTypes } = require('sequelize');
//const sequelize = new Sequelize('sqlite::memory:');

const Staff = sequelize.define('staff', {
  // Model attributes are defined here
  __staff_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _company_id_fk: {
    type: DataTypes.INTEGER
  },
  zip:{
    type: DataTypes.STRING
  },
  is_deleted:{
    type: DataTypes.TINYINT
  },
  access_rights: {
    type: DataTypes.INTEGER
  },
  active: {
    type: DataTypes.TINYINT
  },
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  comments: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING
  },
  date_end: {
    type: DataTypes.DATE
  },
  date_started: {
    type: DataTypes.DATE
  },
  display_staff_name: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  first: {
    type: DataTypes.STRING
  },
  initial: {
    type: DataTypes.STRING
  },
  job_title: {
    type: DataTypes.STRING
  },
  last: {
    type: DataTypes.STRING
  },
  login_created: {
    type: DataTypes.TINYINT
  },
  login_created_date: {
    type: DataTypes.DATE
  },
  login_created_staff: {
    type: DataTypes.STRING
  },
  mobile_phone: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING,
    set(value){
      if(value){
        return this.setDataValue('password', md5(value));
      }
      else{
        return this.setDataValue('password',"");
      }
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  photo: {
    type: DataTypes.STRING
  },
  pin: {
    type: DataTypes.STRING
  },
  postal_code: {
    type: DataTypes.STRING
  },
  privilege_set: {
    type: DataTypes.STRING
  },
  rate: {
    type: DataTypes.DOUBLE
  },
  resource: {
    type: DataTypes.INTEGER
  },
  state: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.INTEGER
  },
  tax_number: {
    type: DataTypes.STRING
  },
  time_employed: {
    type: DataTypes.STRING
  },
  username: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  },
  created_by: {
    type: DataTypes.STRING
  },
  updated_by: {
    type: DataTypes.STRING
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_at: {
    type: DataTypes.DATE
  }
}, {
    tableName: 'staff',
    timestamps: false
  });

module.exports = Staff;