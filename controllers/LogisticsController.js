const { Rental, RentalItems, Client, Administration, Task, TaskResource, TaskVehicle, RentalResource, RentalVehicle } = require("../models/Model")(
  ["Rental", "RentalItems", "Client", "Administration", "Task", "TaskResource", "TaskVehicle", "RentalResource", "RentalVehicle"]
);
const handy = require("../config/common");
const lang = handy.lang;
const moment = require('moment');
const Op = require('sequelize').Sequelize.Op;

module.exports = {
  /**
      * @author Kirankumar
      * @summary This function is used for update the delivery and collection times
      * @param {Rental id} rental_params 
      * @param {Logged in user details} user 
      * @returns Status and upated data
      */
  logistics_delivery_set_times: async function (rental_params, user) {
    if (rental_params && rental_params.rental_id) {
      const { rental_id, is_set_time } = rental_params;
      const data = { rental_id };
      Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', })
      Rental.belongsTo(Administration, { targetKey: '_company_id_fk', foreignKey: '_company_id_fk' });
      const rental_data = await Rental.findOne({
        attributes: ["__rental_id_pk", "delivery", "delivery_address", "collection_date", "collection", "date", "date_end", "time_start", "time_end"], where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id }, include: [
          {
            model: Client,
            attributes: ["address_delivery", "address_billing"]
          }, {
            model: Administration,
            attributes: ["de_prep_days", "prep_days", "checkbox_add_de_prep_days", "checkbox_add_prep_days"]
          }]
      });
      const { client, administration } = rental_data;
      if (rental_data) {
        if (rental_data.delivery == "no") {
          return { status: true, alert: lang('Validation.rental_delivery_alert', user.lang) };
        }
        if (is_set_time) {
          if (rental_data.delivery == "yes")
            data.delivery_time = rental_data.time_start;
          if (rental_data.collection == "yes")
            data.collection_time = rental_data.time_end;
        }
        if (rental_data.delivery == "yes") {
          data.delivery_date = rental_data.date;
        }
        if (rental_data.collection == "yes") {
          data.collection_date = rental_data.date_end;
        }
        if (!rental_data.delivery_address && client) {
          if (!client.address_delivery) {
            data.delivery_address = client.address_billing;
          } else {
            data.delivery_address = client.address_delivery;
          }
        }
        if (administration.prep_days && administration.prep_days && data.delivery_date) {
          data.prep_date = new Date(new Date(data.delivery_date).setDate(new Date(data.delivery_date).getDate() - administration.prep_days));
        }

        if (administration.checkbox_add_de_prep_days && administration.de_prep_days && data.collection_date) {
          data.de_prep_date = new Date(new Date(data.collection_date).setDate(new Date(data.collection_date).getDate() - administration.de_prep_days));
        }
        const out_data = await handy.create_update_table(data, user, Rental, "Rental", "__rental_id_pk");
        return out_data;
      } else {
        return { status: false, message: lang('Validation.invalid_data', user.lang) };
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for update the delivery status to rental
   * @param {Rental id} rental_params 
   * @param {Delivery data} data 
   * @param {Logged in user details} user 
   * @returns Status and updated data
   */
  logistics_delivery_set: async function (rental_params, data, user) {
    if (rental_params && rental_params.rental_id) {
      const rental_id = rental_params.rental_id;
      var invalid_data = false;
      let rental_data = "";
      switch (data.type) {
        case "delivery":
          Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
          rental_data = await Rental.findOne({ attributes: ["__rental_id_pk", "delivery_address", "date_start", "date_end"], where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id }, include: [{ model: Client, attributes: ["address_billing", "address_delivery"] }] })
          if (rental_data) {
            data.delivery = "yes";
            data.pickup = "no";
            data.collection = "yes";
            data.return = "no";
            //need to set selivery address

            //data.delivery_address = "";
            if (rental_data && rental_data.client && !rental_data.delivery_address) {
              data.delivery_address = rental_data.client.address_delivery ? rental_data.client.address_delivery : rental_data.client.address_billing;
            }
            data.collection_date = rental_data.date_end;
            data.delivery_date = rental_data.date_start;
          } else {
            invalid_data = true;
          }
          break;
        case "remove_delivery":
          data.delivery_address = "";
          data.delivery_date = "";
          data.delivery = "no";
          data.delivery_time = "";
          break;
        case "pickup":
          data.delivery = "no";
          data.pickup = "yes";
          data.delivery_date = "";
          data.delivery_time = "";
          data.delivery_address = "";
          data.return = "yes";
          data.collection = "no";
          break;
        case "remove_pickup":
          data.pickup = "no";
          break;
        case "collection":
          Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
          rental_data = await Rental.findOne({ attributes: ["date_end"], where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id } })
          if (rental_data) {
            data.collection = "yes";
            data.return = "no";
            data.collection_date = rental_data.date_end;
          } else {
            invalid_data = true;
          }
          break;
        case "remove_collection":
          data.collection = "no";
          data.collection_date = "";
          data.collection_time = "";
          break;
        case "return":
          data.collection = "no";
          data.return = "yes";
          data.collection_date = "";
          data.collection_time = "";
          break;
        case "remove_return":
          data.return = "no";
          break;
        default:
          return { status: false, message: lang('Validation.invalid_delivery_type', user.lang) }
      }
      if (invalid_data) {
        return { status: false, message: lang('Validation.invalid_data', user.lang) }
      }
      else {
        data.rental_id = rental_id;
        const type_delivery = data.type;
        delete data.type;
        const out_data = await handy.create_update_table(data, user, Rental, "Rental", "__rental_id_pk");
        await this.delivery_collection_task_create_or_delete(data, user);
        var notes_obj = {
          "rental_id": rental_id,
          "notes": lang('History.' + type_delivery, user.lang)
        }
        const notes_data = await handy.create_notes(notes_obj, user);
        out_data.history = notes_data.data.dataValues;
        return out_data;
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for get logistics list for rental.
   * @param {HTTP params} body 
   * @param {Lohhed in user details} user 
   * @returns Status and List of logistics data
   */
  get_rental_logistics: async function (body, user) {
    if (body && body.rental_id) {
      var arr_item = ["__rental_item_id_pk", "_rental_item_id_fk", "_rental_id_fk", "item", "hours_in", "hours_out", "hours_total", "qty", "balance", "status", "quantity_returned", "loss", "replacement_cost", "service_status", "service_period", "last_service_hours", "period_till_service"]
      var get_items = await RentalItems.findAll({ raw: true, order: [["sort", "ASC"]], attributes: arr_item, where: { _rental_id_fk: body.rental_id, type: { [Op.in]: ['RENTAL'] } } })
      get_items = await handy.transformnames('LTR', get_items, "RentalItems");
      return { status: true, data: get_items }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) }
    }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for create the task for delivery and collection
   * @param {Delivery collection data} body 
   * @param {Logged in user details} user 
   * @returns void
   */
  delivery_collection_task_create_or_delete: async function (body, user) {

    if (!body.__rental_id_pk && !body.rental_id) {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    } else {
      body.rental_id = body.rental_id || body.__rental_id_pk;
    }
    const rental_data = await Rental.findOne({ attributes: ["_client_id_fk", "delivery_address", "delivery_date", "delivery_time", "collection_date", "collection_time", "date", "date_end"], where: { __rental_id_pk: body.rental_id } })
    if (rental_data) {
      let client_data = {};
      if (rental_data._client_id_fk) {
        const client = await Client.findOne({ attributes: ["first_name", "last", "address_delivery", "address_billing", "telephone", "account_name"], where: { __client_id_pk: rental_data._client_id_fk } });
        if (client) {
          client_data.location = client.address_delivery || client.address_billing;
          client_data.model_no = client.telephone;
          let name = "";
          if (!client.last && client.first_name) {
            name = client.first_name;
          } else if (client.last && !client.first_name) {
            name = client.last;
          } else {
            name = client.first_name + " " + client.last;
          }
          client_data.customer_contact_details = `${name} \n ${client_data.location} \n ${client_data.model_no}`;
          client_data.client_name = client.account_name;
        }
      }
      //when delivery is there then create delivery task
      if (body.delivery == "yes" && moment(rental_data.delivery_date).isValid()) {
        let data = {};
        data.status = "DUE";
        data._rental_id_fk = body.rental_id;
        data._client_id_fk = rental_data._client_id_fk;
        data.date_end = moment(rental_data.delivery_date).format("YYYY-MM-DD");
        data.date_start = moment(rental_data.delivery_date).format("YYYY-MM-DD");
        data.job_end_date = moment(rental_data.delivery_date).format("YYYY-MM-DD");
        data.time_start = rental_data.delivery_time;
        data.summary = "TASK";
        data.description = "Delivery Call";
        data.is_delivery = 1;
        data.type = "DELIVERY";
        data = { ...data, ...client_data };
        const check = await handy.create_update_table(data, user, Task, "Task", "__task_id_pk");
        console.log(check);
      }
      //when collection is there then create collection task
      if (body.collection == "yes" && moment(rental_data.collection_date).isValid()) {
        let data = {};
        data.status = "DUE";
        data._rental_id_fk = body.rental_id;
        data._client_id_fk = rental_data._client_id_fk;
        data.date_end = moment(rental_data.collection_date).format("YYYY-MM-DD");
        data.date_start = moment(rental_data.collection_date).format("YYYY-MM-DD");
        data.job_end_date = moment(rental_data.collection_date).format("YYYY-MM-DD");
        data.summary = "TASK";
        data.time_start = rental_data.collection_time;
        data.description = "Collection Call";
        data.is_collection = 1;
        data.type = "COLLECTION";
        data = { ...data, ...client_data };
        const check = await handy.create_update_table(data, user, Task, "Task", "__task_id_pk");
        console.log(check);
      }
      //when collection set no then collection tasks remove
      if (body.collection == "no") {
        await this.remove_rental_logistics_task({ is_collection: 1, _rental_id_fk: body.rental_id, is_deleted: 0 }, user);
      }
      //When delivery set no then delivery tasks remove
      if (body.delivery == "no") {
        await this.remove_rental_logistics_task({ is_delivery: 1, _rental_id_fk: body.rental_id, is_deleted: 0 }, user);
      }
    } else {
      return false;
    }
    return true;
  },
  /**
   * @author Kirankumar
   * @summary This function is used for remove logistics task for rental.
   * @param {Rental id} data 
   * @param {Logged in user details} user 
   * @returns status
   */
  remove_rental_logistics_task: async function (where, user) {
    const tasks = await Task.findAll({ attributes: ["__task_id_pk"], where });
    const ids = tasks.map(item => item.__task_id_pk);
    if (ids.length) {
      const check = await handy.delete_task({ task_ids: ids }, user);
      console.log(check);
    }
    return true;
  },

  /**
   * @author Kirankumar
   * @summary This function is used for get the vehicle and driver list
   * @param {Rental id} rental_id 
   * @param {Logged in user details} user 
   * @returns status and resource and vehicle list.
   */
  get_rental_driver_vehicles: async function (data, user) {
    if (data && data.rental_id) {
      Task.belongsTo(TaskResource, { targetKey: '_task_id_fk', foreignKey: '__task_id_pk' });
      Task.belongsTo(TaskVehicle, { targetKey: '_task_id_fk', foreignKey: '__task_id_pk' });
      let task_resource = await Task.findAll({
        attributes: ["__task_id_pk"], where: { _rental_id_fk: data.rental_id },
        include: {
          model: TaskResource,
          attributes: ["__task_resource_id_pk", "_resource_id_fk"],
          where: { __task_resource_id_pk: { [Op.ne]: null } }
        }
      });
      let task_vehicle = await Task.findAll({
        attributes: ["__task_id_pk"], where: { _rental_id_fk: data.rental_id },
        include: {
          model: TaskVehicle,
          attributes: ["__task_vehicle_id_pk", "_resource_id_fk"],
          where: { __task_vehicle_id_pk: { [Op.ne]: null } }
        }
      });
      const res_data = {
        resource_list: await handy.transformnames('LTR', task_resource, "Task", { task_resource: "TaskResource" }, user) || [],
        vehicle_list: await handy.transformnames('LTR', task_vehicle, "Task", { task_vehicle: "TaskVehicle" }, user) || [],
      };
      return { status: true, data: res_data };
    } else {
      return {
        status: true, data: {
          resource_list: [],
          vehicle_list: [],
        }
      }
    }
  },
  /**
   * @author JoysanJawahar
   * @summary This function is used for get the vehicle and driver list
   * @param {Rental id} rental_id 
   * @param {Logged in user details} user 
   * @returns status and resource and vehicle list.
   */
  get_rental_resource_driver_vehicles: async function (data, user) {
    if (data && data.rental_id) {
      Rental.belongsTo(RentalResource, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
      Rental.belongsTo(RentalVehicle, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
      let rental_resource = await Rental.findAll({
        attributes: ["__rental_id_pk"], where: { __rental_id_pk: data.rental_id },
        include: {
          model: RentalResource,
          attributes: ["__rental_resource_id_pk", "_resource_id_fk"],
          where: { __rental_resource_id_pk: { [Op.ne]: null } }
        }
      });
      let rental_vehicle = await Rental.findAll({
        attributes: ["__rental_id_pk"], where: { __rental_id_pk: data.rental_id },
        include: {
          model: RentalVehicle,
          attributes: ["__rental_vehicle_id_pk", "_resource_id_fk"],
          where: { __rental_vehicle_id_pk: { [Op.ne]: null } }
        }
      });
      const res_data = {
        resource_list: await handy.transformnames('LTR', rental_resource, "Task", { rental_resource: "RentalResource" }, user) || [],
        vehicle_list: await handy.transformnames('LTR', rental_vehicle, "Task", { rental_vehicle: "RentalVehicle" }, user) || [],
      };
      return { status: true, data: res_data };
    } else {
      return {
        status: true, data: {
          resource_list: [],
          vehicle_list: [],
        }
      }
    }
  }
}