const { Task, TaskVehicle, TaskResource, Resource } = require("../models/Model")(
  ["Task", "TaskVehicle", "TaskResource", "Resource"]
);
const handy = require("../config/common");
const lang = handy.lang;
const TaskServiceController = {
  /**
   * @author Kirankumar
   * @summary This function is used for update the multiple resource to the Task
   * @param {HTTP input data} data 
   * @param {Logged in user details} user 
   * @return status and data
   */
  add_resource_to_task: async function (data, user) {
    if (data && data.task_id && data.resource_ids && data.resource_ids.length) {
      const _task_id_fk = data.task_id;
      const _company_id_fk = user.company_id;
      const task_resource_data = data.resource_ids.map(_resource_id_fk => ({
        _resource_id_fk,
        _task_id_fk,
        _company_id_fk,
        created_by: user.user_id,
        created_at: new Date()
      }));
      await TaskResource.bulkCreate(task_resource_data);
      const res_data = await this.get_task_resource(data.task_id, user);
      return { status: true, data: res_data };
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for update the multiple resource to the Task
   * @param {HTTP input data} data 
   * @param {Logged in user details} user 
   * @return status and data
   */
  add_vehicle_to_task: async function (data, user) {
    if (data && data.task_id && data.vehicle_ids && data.vehicle_ids.length) {
      const _task_id_fk = data.task_id;
      const _company_id_fk = user.company_id;
      const task_vehicle_data = data.vehicle_ids.map(_resource_id_fk => ({
        _resource_id_fk,
        _task_id_fk,
        _company_id_fk,
        created_by: user.user_id,
        created_at: new Date()
      }));
      await TaskVehicle.bulkCreate(task_vehicle_data);
      const res_data = await this.get_task_vehicle(data.task_id, user);
      return { status: true, data: res_data };
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for get the task resources
   * @param {Task id} task_id 
   * @param {Logged in user details} user 
   * @returns array of task resource list
   */
  get_task_resource: async function (task_id, user) {
    TaskResource.belongsTo(Resource, { targetKey: '__resource_id_pk', foreignKey: '_resource_id_fk' });
    let data = await TaskResource.findAll({
      attributes: { exclude: ["created_by", "created_at"] }, where: { _task_id_fk: task_id, _company_id_fk: user.company_id }, include: {
        model: Resource,
        attributes: ["name", "mobile"]
      }
    });
    data = await handy.transformnames("LTR", data, "TaskResource", { resource: "Resource" }, user);
    return data || [];
  },
  /**
   * @author Kirankumar
   * @summary This function is used for get the task vahicles
   * @param {Task id} task_id 
   * @param {Logged in user details} user 
   * @returns array of task resource list
   */
  get_task_vehicle: async function (task_id, user) {
    TaskVehicle.belongsTo(Resource, { targetKey: '__resource_id_pk', foreignKey: '_resource_id_fk' });
    let data = await TaskVehicle.findAll({
      attributes: { exclude: ["created_by", "created_at"] }, where: { _task_id_fk: task_id, _company_id_fk: user.company_id }, include: {
        model: Resource,
        attributes: ["name"]
      }
    });
    data = await handy.transformnames("LTR", data, "TaskVehicle", { resource: "Resource" }, user);
    return data || [];
  },
  /**
   * @author Kirankumar
   * @summary This function is used for delete the task resources
   * @param {Task Resource id} task_resource_id 
   * @param {Logged in user details} user 
   * @returns status and message
   */
  delete_task_resource: async function (task_resource_id, user) {
    if (task_resource_id) {
      let count = await TaskResource.count({ where: { __task_resource_id_pk: task_resource_id, _company_id_fk: user.company_id } });
      if (count) {
        let deleted_count = await TaskResource.destroy({ where: { __task_resource_id_pk: task_resource_id, _company_id_fk: user.company_id } });
        if (deleted_count) {
          return { status: true, message: lang('Validation.record_deleted', user.lang) };
        } else {
          return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
        }
      } else {
        return { status: false, message: lang('Validation.record_not_exist', user.lang) };
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for delete the task vehicle
   * @param {Task Vehicle id} task_vehicle_id
   * @param {Logged in user details} user 
   * @returns status and message
   */
  delete_task_vehicle: async function (task_vehicle_id, user) {
    if (task_vehicle_id) {
      let count = await TaskVehicle.count({ where: { __task_vehicle_id_pk: task_vehicle_id, _company_id_fk: user.company_id } });
      if (count) {
        let deleted_count = await TaskVehicle.destroy({ where: { __task_vehicle_id_pk: task_vehicle_id, _company_id_fk: user.company_id } });
        if (deleted_count) {
          return { status: true, message: lang('Validation.record_deleted', user.lang) };
        } else {
          return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
        }
      } else {
        return { status: false, message: lang('Validation.record_not_exist', user.lang) };
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for get tasks with filters.
   * @param {HTTP request data} body 
   * @param {Logged in user details} user 
   * @returns List of tasks data.
   */
  get_tasks: async function (body, user) {
    let { start, limit, offset, where, attributes, order } = await handy.grid_filter(body, "Task", true, user.company_id);
    attributes = handy.setDateFormat(attributes, ["date_start", "date_end"], user.date_format);
    let condition = {
      limit, offset, where, attributes, order
    }
    var res_data = await Task.findAndCountAll(condition);
    let data = await handy.transformnames('LTR', res_data.rows, "Task", {}, user);
    data = data ? data : [];
    data = await this.set_color_codes(data);
    const endRow = await handy.get_end_row(offset, limit, res_data.count);
    return { status: true, count: res_data.count, endRow, data };
  },
  /**
   * @author JoysanJawahar
   * @summary This function is used for get tasks data with filters.
   * @param {HTTP request data} req 
   * @param {Logged in user details} user 
   * @returns List of tasks data.
   */
  get_driver_tasks: async function (req, user) {
    const condition = await handy.get_task_driver_data_filters(req, user);
    var res_data = await TaskResource.findAndCountAll(condition);
    let data = await handy.transformnames('LTR', res_data.rows, "TaskResource", { task: "Task" }, user);
    data = data ? data : [];
    for (let type = 0; type < data.length; type++) {
      if (!data[type]["is_delivery"] && !data[type]["is_collection"]) {
        data[type]["task_type"] = 'Service'
      } else {
        data[type]["task_type"] = 'Rental'
      }
    }
    const endRow = await handy.get_end_row(condition?.offset, limit, res_data.count);
    return { status: true, count: res_data.count, endRow, data };
  },
  /**
   * @author Anik
   * @summary This function is used for get logistic tasks with filters.
   * @param {HTTP request data} body 
   * @param {Logged in user details} user 
   * @returns List of tasks data.
   */
  get_taskData: async function (req, user) {
    const condition = await handy.get_logistic_data_filters(req?.body, user);
    var res_data = await Task.findAndCountAll(condition);
    let data = await handy.transformnames('LTR', res_data.rows, "Task", {}, user);
    data = data ? data : [];
    if (data.length) {
      data = await handy.get_task_driver_vehicles(data, user);
    }
    data.data = await this.set_logistic_color_codes(data?.data);
    const endRow = await handy.get_end_row(condition?.offset, limit, res_data.count);
    return { status: true, count: res_data.count, endRow, data };
  },

  /**
   * @author Anik
   * @summary This function is used for update task table.
   * @param {HTTP request data} body 
   * @param {Logged in user details} user 
   * @returns updated tasks data.
   */
  update_taskData: async function (body, user) {
    if (body && body.task_id && body.priority) {
      const res_data = await Task.update({ priority: body?.priority }, { where: { __task_id_pk: body?.task_id } });
      let data = [];
      if (res_data[0]) {
        data = body;
      }
      return { status: true, data };
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },

  /**
   * @author Kirankumar
   * @summary This function is used for set the color codes for Task list.
   * @param {Task List} data 
   * @returns Task list.
   */
  set_color_codes: async function (data) {
    const config =
      [{
        status: "DUE",
        color: "#CC281F"
      }, {
        status: "OVERDUE",
        color: "#CC281F"
      }, {
        status: "PENDING",
        color: "#FD9A00"
      }, {
        status: "IN PROGRESS",
        color: "#9CCB5D"
      }, {
        status: "COMPLETED",
        color: "#6293FE"
      }]
    for (let i = 0; i < data.length; i++) {
      let status = data[i].status ? data[i].status.toLowerCase() : "";
      const find_color_code = config.find(item => item.status.toLowerCase() == status);
      data[i].color_code = find_color_code ? find_color_code.color : "";
    }
    return data;
  },

  /**
  * @author Anik
  * @summary This function is used for set the color codes for Logistic list.
  * @param {Logistic List} data 
  * @returns Logistic list.
  */
   set_logistic_color_codes: async function (data) {
    const config =
      [{
        status: "DUE",
        color: 'RGBA(164,8,0,0.85)'
      }, {
        status: "OVERDUE",
        color: 'RGBA(164,8,0,0.85)'
      }, {
        status: "PENDING",
        color:'RGBA(98,147,254,0.85)'

      }, {
        status: "IN PROGRESS",
        color: 'RGBA(230,148,21,0.85)'
      }, {
        status: "COMPLETED",
        color: 'RGBA(108,166,61,0.85)'
      }]
    for (let i = 0; i < data?.length; i++) {
      let status = data[i].status ? data[i].status.toLowerCase() : "";
      const find_color_code = config.find(item => item.status.toLowerCase() == status);
      data[i].color_code = find_color_code ? find_color_code.color : "";
    }
    return data;
  }
}

module.exports = TaskServiceController;