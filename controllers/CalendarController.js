const { ConfigCalendarStatus } = require("../models/Model")(
  ["ConfigCalendarStatus"]
);;
const handy = require("../config/common");
const { lang } = handy
const Op = require('sequelize').Sequelize.Op;

const calender = {
  /**
   * @author Kirankumar
   * @summary This function is used for create or update the calendar status record
   * @param {HTTP input data} body 
   * @param {Logged in user details} user 
   * @returns Status and updated data
   */
  create_update_calender_status: async function (body, user, fastify) {
    if (body.config_calendar_status_id || (body.name && body.color_rgb_value)) {
      if (body.name) {
        let where = { _company_id_fk: user.company_id, name: body.name };
        if (body.config_calendar_status_id) {
          where.__config_calendar_status_id_pk = { [Op.ne]: body.config_calendar_status_id };
        }
        const count = await ConfigCalendarStatus.count({ where })
        if (count) {
          return { status: false, message: lang('Validation.calendar_status_exist', user.lang) };
        }
      }
      const responds = await handy.create_update_table(body, user, ConfigCalendarStatus, "ConfigCalendarStatus", "__config_calendar_status_id_pk");
      if (responds.status) {
        handy.cacheDel(fastify.appCache, "calendar_status_list", user, "company_" + user.company_id + "_drop_down_data");
      }
      return responds;
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for delete the calendar status record.
   * @param {HTTP input} body 
   * @param {Logged in user details} user 
   * @returns Status and message.
   */
  delete_calendar_status: async function (body, user, fastify) {
    if (body && body.config_calendar_status_id) {
      const count = await ConfigCalendarStatus.count({ where: { _config_calendar_status_id_pk: body.config_calendar_status_id, _company_id_fk: user.company_id } });
      if (count) {
        const deleted_count = await ConfigCalendarStatus.destroy({ where: { __config_calendar_status_id_pk: body.config_calendar_status_id, _company_id_fk: user.company_id } });
        if (deleted_count) {
          handy.cacheDel(fastify.appCache, "calendar_status_list", user, "company_" + user.company_id + "_drop_down_data");
          return { status: false, message: lang('Validation.record_deleted', user.lang) };

        } else {
          return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
        }
      } else {
        return { status: false, message: lang('Validation.record_not_exist', user.lang) };
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  }
}

module.exports = calender;