const { DeliveryPrice, ConfigBusiness, ConfigDefaultRate, Rate, Administration, CreditCardRate, TaxRate, Resource, Auth, JobStatus } = require("../models/Model")(
    ["DeliveryPrice", "ConfigBusiness", "ConfigDefaultRate", "Rate", "Administration", "CreditCardRate", "TaxRate", "Resource", "Auth", "JobStatus"]
);
let handy = require("../config/common");
let lang = require('../language/translate').validationMsg;
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
let md5 = require('md5');
const NodeCache = require('node-cache');
const catche = new NodeCache();

async function AdminRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This function is used for update the admin data
     * @input Json input
     * @return status and updated data
     */
    fastify.post('/admin/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && Object.keys(req.body).length) {
                let custom_fields = handy.transformnames('RTL', req.body, "Administration");
                const required_fields = Object.keys(custom_fields);
                custom_fields._company_id_fk = user.company_id;
                //check company is valid or not
                const count = await Administration.count({ where: { _company_id_fk: user.company_id } });
                if (count) {
                    custom_fields.updated_by = user.user_id;
                    await Administration.update(custom_fields, { where: { _company_id_fk: user.company_id } });
                } else {
                    custom_fields.created_at = new Date();
                    custom_fields.created_by = user.user_id;
                    await Administration.create(custom_fields);
                }
                const data = await getCustomFiels(user.company_id, required_fields);
                res.status(200).send({ status: true, data });
                handy.cacheDel(catche, "custom", user);
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function is used to update the business for admin
     * @input Json input
     * @return status and updated data
     */
    fastify.post('/admin/business/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_update_business(req, user);
            if (data.status) {
                res.status(200).send(data)
                handy.cacheDel(catche, "business", user);
            } else {
                res.status(500).send(data)
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })

    /**
     * @author Kirankumar
     * @summary This function is used for dalete the company business
     * @param business_id, business id
     * @returns status and message
     */
    fastify.delete('/admin/business/delete/:business_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.business_id) {
                const count = await ConfigBusiness.count({ where: { __business_id_pk: req.params.business_id, _company_id_fk: user.company_id, is_deleted: 0 } });
                if (count) {
                    const del_status = await ConfigBusiness.update({ is_deleted: 1 }, { where: { __business_id_pk: req.params.business_id } });
                    if (del_status[0]) {
                        res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                        handy.cacheDel(catche, "business", user);
                        handy.cacheDel(fastify.appCache, "business_list", user, "company_" + user.company_id + "_drop_down_data");
                    } else {
                        res.status(501).send({ status: false, message: lang('Validation.record_not_deleted', user.lang) });
                    }
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })


    /**
     * @author Kirankumar
     * @summary This function is used to get default config rates
     * @returns Status and rate list
     */
    fastify.get('/default/rates/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let data = await ConfigDefaultRate.findAll({ attributes: [`label`, `label_name`, `in_days`, `price`, `is_hourly`, `is_daily`, `is_half_day`, `is_weekly`, `is_monthly`, `is_quarterly`, `is_half_yearly`, `is_yearly`, `extra_period`, `rate_type`, `rates_order`] });
            data = handy.transformnames('LTR', data, "ConfigDefaultRate");
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function is usefull to update the company rates
     * @input rate data
     * @returns status and updated data
     */
    fastify.post('/admin/rates/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, Rate, "Rate", "__rate_config_id_pk");

            //let data = await create_update_rate(req,user)
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(catche, "rate", user);
                handy.cacheDel(fastify.appCache, "rate_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });


    /**
     * @author Kirankumar
     * @summary This function is used to get all admin data.
     * @returns status and All admin data
     */
    fastify.post('/admin/get', async (req, res) => {
        try {
            //const catche = fastify.myCache;
            const start_date_time = new Date().toUTCString();
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let admin_data = {};
            let is_updated_catch = false;
            if (catche.has("company_" + user.company_id)) {
                admin_data = catche.get("company_" + user.company_id);
            }
            let data = {};
            const body = req.body;
            if (body && body.required && body.required.length) {
                if (body.required.includes("rate")) {
                    if (admin_data.rate) {
                        data.rate = admin_data["rate"];
                    } else {
                        is_updated_catch = true;
                        data.rate = admin_data.rate = await getAdminRates(user.company_id);
                    }
                }
                if (body.required.includes("cards")) {
                    if (admin_data.cards) {
                        data.cards = admin_data.cards;
                    } else {
                        is_updated_catch = true;
                        data.cards = admin_data.cards = await getAdminCards(user.company_id);
                    }
                }
                if (body.required.includes("tax")) {
                    if (admin_data.tax) {
                        data.tax = admin_data.tax;
                    } else {
                        is_updated_catch = true;
                        admin_data.tax = data.tax = await getAdminTax(user.company_id);
                    }
                }
                if (body.required.includes("custom")) {
                    if (admin_data.custom) {
                        data.custom = admin_data.custom;
                    } else {
                        is_updated_catch = true;
                        data.custom = admin_data.custom = await getCustomFiels(user.company_id);
                    }
                }
                if (body.required.includes("job_status")) {
                    if (admin_data.job_status) {
                        data.job_status = admin_data.job_status;
                    } else {
                        is_updated_catch = true;
                        data.job_status = admin_data.job_status = await get_job_status(user);
                    }
                }
                // if(body.required.includes("delivery_price")){
                //     data.delivery_price = await getDeliveryPrice(user.company_id);
                // }
                if (body.required.includes("business")) {
                    if (admin_data.business) {
                        data.business = admin_data.business;
                    } else {
                        is_updated_catch = true;
                        data.business = admin_data.business = await getBusiness(user.company_id);
                    }
                }
            } else {
                if (admin_data.custom) {
                    data.custom = admin_data.custom;
                } else {
                    is_updated_catch = true;
                    admin_data.custom = data.custom = await getCustomFiels(user.company_id);
                }
            }
            if (is_updated_catch) {
                catche.set("company_" + user.company_id, data)
            }
            res.status(200).send({ status: true, data, start_date_time, end_date_time: new Date().toUTCString() });
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This rout is used for get delivery price with filters.
     * @returns status, count and delivery price list
     */
    fastify.post('/admin/deliveryprice/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //Here including filters
            let { limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "DeliveryPrice", false, user.company_id);
            const condition = { limit, offset, where, order };
            if (attributes && attributes.length) {
                condition.attributes = attributes;
            }
            const res_data = await DeliveryPrice.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "DeliveryPrice");
            data = data ? data : [];
            const endRow = await handy.get_end_row(offset, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (error) {
            res.status(501).send(error);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used to delete rate item by id
     * @param {rate_id} rate id
     * @returns status and message
     */
    fastify.delete('/admin/rate/delete/:rate_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.rate_id) {
                const count = await Rate.destroy({ where: { compeny_id: user.company_id, __rate_config_id_pk: req.params.rate_id } });
                if (count) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                    handy.cacheDel(catche, "rate", user);
                    handy.cacheDel(fastify.appCache, "rate_list", user, "company_" + user.company_id + "_drop_down_data");
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function is used for delete card for company
     * @param {card id} card_id
     * @returns Status and message
     */
    fastify.delete('/admin/cards/delete/:card_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.card_id) {
                const count = await CreditCardRate.destroy({ where: { _company_id_fk: user.company_id, __credit_card_rate_id_pk: req.params.card_id } });
                if (count) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                    handy.cacheDel(catche, "cards", user);
                    handy.cacheDel(fastify.appCache, "credit_rate_list", user, "company_" + user.company_id + "_drop_down_data");
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function is used for update cards
     * @input {input json card data} card data
     * @returns status and updated data
     */
    fastify.post('/admin/cards/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, CreditCardRate, "CreditCardRate", "__credit_card_rate_id_pk");
            //const data = await create_update_cards(req,user)
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(catche, "cards", user);
                handy.cacheDel(fastify.appCache, "credit_rate_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This route is usefull to create tax rates(ex:- GST...) in admin 
     * @returns Status and Updated data
     */
    fastify.post('/admin/tax/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, TaxRate, "TaxRate", "__tax_rate_id_pk");
            //const data= await create_update_tax(req, user);
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(catche, "tax", user);
                handy.cacheDel(fastify.appCache, "tax_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });



    /**
     * @author Kirankumar
     * @summary This rout is used for create or update delivery charge
     * @returns status and Updated data
     */
    fastify.post('/admin/deliverycharge/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, DeliveryPrice, "DeliveryPrice", "__delivery_price_id_pk");
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This router is used for delete the delivery charge item by id
     * @param {delivery charge id} price_id
     * @returns status and message
     */
    fastify.delete('/admin/deliverycharge/delete/:price_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.price_id) {
                const count = await DeliveryPrice.destroy({ where: { _company_id_fk: user.company_id, __delivery_price_id_pk: req.params.price_id } });
                if (count) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is usefull to set default tax for company
     * @returns status and message.
     */
    fastify.put('/admin/tax/setdefault/:tax_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const count = await TaxRate.count({ where: { __tax_rate_id_pk: req.params.tax_id } });
            if (!count) {
                res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                return;
            }
            if (req.params.tax_id) {
                TaxRate.update({ is_default: 0, updated_by: user.user_id }, { where: { _company_id_fk: user.company_id } });
                await TaxRate.update({ is_default: 1, updated_by: user.user_id }, { where: { __tax_rate_id_pk: req.params.tax_id } });
                const res_data = await getTaxByID(req.params.tax_id);
                res.status(200).send({ status: true, data: res_data });
                handy.cacheDel(catche, "tax", user);
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is usefull for delete the tax by id
     * @returns Status and message
     */
    fastify.delete('/admin/tax/delete/:tax_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.tax_id) {
                const count = await TaxRate.destroy({ where: { __tax_rate_id_pk: req.params.tax_id } });
                if (count) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                    handy.cacheDel(catche, "tax", user);
                    handy.cacheDel(fastify.appCache, "tax_list", user, "company_" + user.company_id + "_drop_down_data");
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });



    /**
     * @author Kirankumar
     * @summary This rout is used to create or update resource for company
     * @returns status and updated data
     */
    fastify.post('/admin/resource/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, Resource, "Resource", "__resource_id_pk");
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used for delete the resource
     * @param {resource id} resource_id
     * @returns status and message
     */
    fastify.delete('/admin/resource/delete/:resource_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let check_deleted = await Resource.count({ where: { __resource_id_pk: req.params.resource_id, is_deleted: 0 } })
            if (!check_deleted) {
                res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
            }
            let delete_update_query = await Resource.update({ updated_by: user.company_id, is_deleted: 1 }, { where: { __resource_id_pk: req.params.resource_id } })
            if (delete_update_query) {
                res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                handy.cacheDel(fastify.appCache, "vehicle_list", user, "company_" + user.company_id + "_drop_down_data");
                handy.cacheDel(fastify.appCache, "driver_list", user, "company_" + user.company_id + "_drop_down_data");
            }
            else {
                res.status(200).send({ status: false, message: lang('Validation.record_not_deleted', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for get the resorces for company
     * @returns List of resources.
     */
    fastify.get('/admin/resource/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const get_all = await get_resource(user);
            res.status(200).send({ status: true, data: get_all });
        }
        catch (e) {
            res.status(501).send(e);
        }
    })



    /**
     * @author Kirankumar
     * @summary This rout is used to create or update the staff
     * @returns Status and Updated data
     */
    fastify.post('/admin/staff/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await insert_update_staff(req.body, user);
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(fastify.appCache, "vehicle_list", user, "company_" + user.company_id + "_drop_down_data");
                handy.cacheDel(fastify.appCache, "driver_list", user, "company_" + user.company_id + "_drop_down_data");
                handy.cacheDel(fastify.appCache, "staff_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
            //let inpt_staff = handy.transformnames('RTL', req.body, "Auth");
            //let ins_staff = await insert_update_staff(res, user, inpt_staff, req.params.staff_id);
            //res.status(200).send({ status: true, data: ins_staff })
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used to get the list of staff data
     * @returns status and List of staff data
     */
    fastify.get('/admin/staff/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let ins_staff = await get_staff(user);
            res.status(200).send({ status: true, data: ins_staff })
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Bharath
     * @summary This rout is used to get staff data by id
     * @param {staff id} staff_id
     * @returns status and staff data
     */
    fastify.get('/admin/staff/get/:staff_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //no need to check
            // let check_deleted = await Auth.count({ where: { __staff_id_pk: req.params.staff_id, is_deleted: 0 } })
            // if (!check_deleted) {
            //     res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
            // }
            let ins_staff = await get_staff(user, req.params.staff_id);
            res.status(200).send({ status: true, data: ins_staff })
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the staff
     * @param {staff id} staff_id
     * @returns status and message
     */
    fastify.delete('/admin/staff/delete/:staff_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let check_deleted = await Auth.count({ where: { __staff_id_pk: req.params.staff_id, is_deleted: 0 } })
            if (!check_deleted) {
                res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
            }
            let delete_update_query = await Auth.update({ updated_by: user.company_id, is_deleted: 1 }, { where: { __staff_id_pk: req.params.staff_id } })
            if (delete_update_query) {
                res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                handy.cacheDel(fastify.appCache, "staff_list", user, "company_" + user.company_id + "_drop_down_data");
            }
            else {
                res.status(200).send({ status: false, message: lang('Validation.record_not_deleted', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create the job status
     * @input Job status data
     * @returns Status and updated data 
     */
    fastify.post('/admin/jobstatus/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && !req.body.job_status_id && req.body.job_status) {
                if (req.body['color_code']) {
                    req.body.color = req.body['color_code'];
                    delete req.body['color_code'];
                }
                const data = await handy.create_update_table(req.body, user, JobStatus, "JobStatus", "__job_status_id_pk");
                if (data.status) {
                    res.status(200).send(data);
                    handy.cacheDel(catche, "job_status", user);
                } else {
                    res.status(500).send(data);
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update the job status
     * @input Job status data
     * @returns Status and updated data 
     */
    fastify.post('/admin/jobstatus/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.job_status_id) {
                if (req.body['color_code']) {
                    req.body.color = req.body['color_code'];
                    delete req.body['color_code'];
                }
                const data = await handy.create_update_table(req.body, user, JobStatus, "JobStatus", "__job_status_id_pk");
                if (data.status) {
                    res.status(200).send(data);
                    handy.cacheDel(catche, "job_status", user);
                } else {
                    res.status(500).send(data);
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used to delete the job status by id
     * @param {job status id}
     * @returns status and message
     */
    fastify.delete('/admin/jobstatus/delete/:jobstatus_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let check_deleted = await JobStatus.count({ where: { __job_status_id_pk: req.params.jobstatus_id, is_deleted: 0 } })
            if (!check_deleted) {
                res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
            }
            let delete_update_query = await JobStatus.update({ updated_by: user.company_id, is_deleted: 1 }, { where: { __job_status_id_pk: req.params.jobstatus_id } })
            if (delete_update_query) {
                res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                handy.cacheDel(catche, "job_status", user);
            }
            else {
                res.status(200).send({ status: false, message: lang('Validation.record_not_deleted', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
    * @author Kirankumar
    * @summary This function is usefull to get the bussiness data for company
    * @param {company id} company_id 
    * @returns List of businesses
    */
    async function getBusiness(company_id) {
        let data = await ConfigBusiness.findAll({ attributes: { exclude: ["_company_id_fk", "is_deleted", "created_by", "updated_by", "created_at", "updated_at"] }, where: { _company_id_fk: company_id, is_deleted: 0 }, order: [["is_main_business", "DESC"], ["__business_id_pk", "ASC"]] });
        data = handy.transformnames('LTR', data, "ConfigBusiness");
        return data || [];
    }

    /**
     * @author Kirankumar
     * @summary This function is used to get admin data with fields
     * @param {company id} company_id 
     * @param {attributes for get} required_fields 
     * @returns admin data
     */
    async function getCustomFiels(company_id, required_fields = []) {
        let condition = { where: { _company_id_fk: company_id } }
        if (required_fields.length) {
            condition.attributes = required_fields;
        } else {
            condition.attributes = { exclude: ["__administration_id_pk", "_company_id_fk", "updated_at", "created_at", "updated_by", "created_by"] };
        }
        let data = await Administration.findOne(condition);
        data = handy.transformnames('LTR', data, "Administration");
        return data || {};
    }

    /**
     * @author Kirankumar
     * @summary This function is usefull to get the tax by id
     * @param {tax id} tax_id 
     * @returns tax data
     */
    async function getTaxByID(tax_id) {
        let data = await TaxRate.findOne({ attributes: { exclude: ["_company_id_fk", "updated_at", "created_at", "updated_by", "created_by"] }, where: { __tax_rate_id_pk: tax_id } });
        data = handy.transformnames('LTR', data, "TaxRate");
        return data || {};
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get all tax rate data
     * @param {company id} company_id 
     * @returns List of tax rate data
     */
    async function getAdminTax(company_id) {
        let data = await TaxRate.findAll({ where: { _company_id_fk: company_id } });
        data = handy.transformnames('LTR', data, "TaxRate");
        return data || [];
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get job status data
     * @param {logged in user data} user 
     * @returns List of job status
     */
    async function get_job_status(user) {
        let get_query_comp = await JobStatus.findAll({ attributes: ["__job_status_id_pk", "job_status", "color"], where: { _company_id_fk: user.company_id, is_deleted: 0 } })
        get_query_comp = handy.transformnames('LTR', get_query_comp, "JobStatus");
        return get_query_comp;
    }

    /**
     * @author Kirankumar
     * @summary This function is used to create or update the business
     * @param {HTTP request} req 
     * @param {Logged in user data} user 
     * @returns status and updated data.
     */
    async function create_update_business(req, user) {
        let cur_main = false;
        let data = {};
        let business_body = req.body;
        if (business_body) {
            business = handy.transformnames('RTL', business_body, "ConfigBusiness");
            if (!cur_main && business.is_main_business == 1) {
                cur_main = true;
                await ConfigBusiness.update({ is_main_business: 0 }, { where: { _company_id_fk: user.company_id } });
            } else {
                business.is_main_business = 0;
            }
            data = await handy.create_update_table(business, user, ConfigBusiness, "ConfigBusiness", "__business_id_pk");
            handy.cacheDel(fastify.appCache, "business_list", user, "company_" + user.company_id + "_drop_down_data");
            handy.cacheDel(catche, "business", user);
            return data;
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used to update the staff and resource data
     * @param {staff data} data 
     * @param {Logged in user data} user 
     * @returns status and Updated staff data
     */
    async function insert_update_staff(data, user) {
        if (data.pin) {
            const where = { where: { pin: data.pin } };
            if (data.staff_id)
                where.where.__staff_id_pk = { [Op.ne]: data.staff_id }
            const count = await Auth.count(where);
            if (count)
                return { status: false, message: lang('Validation.pin_exist', user.lang) };
        }
        if (data.email) {
            let where = { email: data.email, is_deleted: 0 };
            if (data.staff_id) {
                where.__staff_id_pk = { [Op.ne]: data.staff_id };
            }
            let email_validate = await Auth.count({ where })
            if (email_validate > 0) {
                return { status: false, message: lang('Validation.email_validation', user.lang) };
            }
        }
        const res_data = await handy.create_update_table(data, user, Auth, "Auth", "__staff_id_pk");

        if (res_data.status) {
            let display_staff_name = "";
            const staff_data = await Auth.findOne({ attributes: ["first", "last", "resource", "mobile_phone"], where: { __staff_id_pk: res_data.data.staff_id, is_deleted: 0 } });
            if (res_data.data.staff_id) {
                display_staff_name = staff_data.first + (staff_data.first && staff_data.last ? " " : "") + staff_data.last;
                await Auth.update({ display_staff_name }, { where: { __staff_id_pk: res_data.data.staff_id } });
            }
            if (staff_data.resource) {
                let abbreviation = "";
                //getting first letter of first name
                if (staff_data.first) {
                    abbreviation = staff_data.first[0]
                }
                //getting first letter of last name
                if (staff_data.last) {
                    abbreviation += staff_data.last[0]
                }
                const ressourcs_count = await Resource.count({ where: { _staff_id_fk: res_data.data.staff_id, is_deleted: 0 } });
                const resource_data = { name: (display_staff_name || "").toUpperCase(), abbreviation, id_resource: abbreviation, type: "STAFF", mobile: staff_data.mobile_phone };
                if (ressourcs_count) {
                    await Resource.update(resource_data, { where: { _staff_id_fk: res_data.data.staff_id, is_deleted: 0 } })
                } else {
                    resource_data._staff_id_fk = res_data.data.staff_id;
                    resource_data.created_at = new Date();
                    resource_data.created_by = user.user_id;
                    resource_data._company_id_fk = user.company_id;
                    await Resource.create(resource_data);
                }
            }
        }
        return res_data;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get staff data 
     * @param {Logged in user data} user 
     * @param {staff id} staff_id 
     * @returns status and staff data
     */
    async function get_staff(user, staff_id) {
        let where_cond = {};
        let cond_attributes = [];
        if (staff_id) {
            where_cond = { __staff_id_pk: staff_id, is_deleted: 0 };
            cond_attributes = ["__staff_id_pk", "zip", "access_rights", "active", "address", "city", "comments", "date_end", "date_started", "display_staff_name", "email", "first", "last", "job_title", "mobile_phone", "phone", "pin", "rate", "resource", "state", "status", "tax_number", "time_employed", "username", "password", "photo"];
        }
        else {
            where_cond = { _company_id_fk: user.company_id, is_deleted: 0 };
            cond_attributes = ["__staff_id_pk", "display_staff_name", "mobile_phone", "phone"]
        }
        let staff_get = await Auth.findAll({ attributes: cond_attributes, where: where_cond })
        staff_get = handy.transformnames('LTR', staff_get, "Auth");
        return staff_get;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get the resource data by id
     * @param {Logged in user data} user 
     * @param {resource id} resource_id 
     * @returns status and resource data
     */
    async function get_resource(user, resource_id) {
        let where_cond = {}
        if (resource_id) {
            where_cond = { __resource_id_pk: resource_id, is_deleted: 0 };
        }
        else {
            where_cond = { _company_id_fk: user.company_id, is_deleted: 0 };
        }
        let resource_get = await Resource.findAll({ attributes: ["__resource_id_pk", "abbreviation", "id_resource", "mobile", "name", "priority", "type"], where: where_cond, order: [["priority", "asc"]] })
        resource_get = handy.transformnames('LTR', resource_get, "Resource");
        return resource_get;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get the cards config data
     * @param {company id} company_id 
     * @returns status and List of cards data
     */
    async function getAdminCards(company_id) {
        let data = await CreditCardRate.findAll({ attributes: ["__credit_card_rate_id_pk", "card_name", "card_percentage"], where: { _company_id_fk: company_id } });
        data = handy.transformnames('LTR', data, "CreditCardRate");
        return data || [];
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get the company rates data
     * @param {company id} company_id 
     * @returns status and List of rates data
     */
    async function getAdminRates(company_id) {
        // let data = {};
        // const count = await Administration.count({ where: { _company_id_fk: company_id } });
        // if (count) {
        //     data.default = await Administration.findOne({ raw: true, attributes: ["default_rate", "default_billing_period", "use_meterage", "is_price_incl_tax"], where: { _company_id_fk: company_id } }) || {};
        // }
        let rate_data = await Rate.findAll({ order: [['rates_order', 'ASC']], attributes: [`__rate_config_id_pk`, `_item_type_id_fk`, `label`, `label_name`, `in_days`, `price`, `is_hourly`, `is_daily`, `rate_type`, `rates_order`], where: { compeny_id: company_id } });
        rate_data = handy.transformnames('LTR', rate_data, "Rate");
        rate_data = rate_data ? rate_data : [];
        return rate_data;
    }

    // async function insert_update_staff(res, user, data, staff_id) {
    //     try {
    //         let str_resource_check = data.resource;
    //         data._company_id_fk = user.company_id;
    //         data.display_staff_name = (data.first ? data.first : "") + " " + (data.last ? data.last : "");
    //         if (!staff_id) {
    //             let str_pwd = data.password;
    //             if (md5(str_pwd) !== md5(data.confirm_password)) {
    //                 res.status(501).send({ status: false, message: lang('Validation.login_invalid_password', user.lang) })
    //             }
    //             data.password = md5(str_pwd);
    //             data.created_at = new Date();

    //             let create_staff = await Auth.create(data);
    //             if (create_staff) {
    //                 const get_staffId = create_staff.get("__staff_id_pk");
    //                 if (str_resource_check) {
    //                     let check_exist = await Resource.count({ where: { _staff_id_fk: get_staffId, is_deleted: 0 } })
    //                     if (!check_exist) {
    //                         let data_res = { resource_name: data.first + " " + data.last, abbreviation: data.last, id_resource: data.last, resource_type: "STAFF" }
    //                         let create_resource = await insert_update_resource(res, user, data_res);
    //                     }
    //                 }
    //                 let get_create_rec = await get_staff(user, get_staffId);
    //                 return get_create_rec;
    //             }
    //             else {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) });
    //             }
    //         }
    //         else {
    //             //check valid
    //             let check_valid = await Auth.count({ where: { __staff_id_pk: staff_id, is_deleted: 0 } })
    //             if (!check_valid) {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
    //             }
    //             //password verify
    //             if (data.password && data.confirm_password) {
    //                 if (md5(data.password) !== md5(data.confirm_password)) {
    //                     res.status(501).send({ status: false, message: lang('Validation.login_invalid_password', user.lang) })
    //                 }
    //             }
    //             ["password", "confirm_password"].forEach(e => delete data[e]);
    //             let update_staff = await Auth.update(data, { where: { __staff_id_pk: staff_id } });
    //             if (update_staff) {
    //                 if (str_resource_check) {
    //                     let update_check_exist = await Resource.count({ where: { _staff_id_fk: staff_id, is_deleted: 0 } })
    //                     if (!update_check_exist) {
    //                         let data_res = { resource_name: data.first + " " + data.last, abbreviation: data.last, id_resource: data.last, resource_type: "STAFF" }
    //                         let update_resource = await insert_update_resource(res, user, data_res);
    //                     }
    //                 }
    //                 let get_update_rec = await get_staff(user, staff_id);
    //                 return get_update_rec;
    //             }
    //             else {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_updated', user.lang) });
    //             }
    //         }
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // }

    // async function insert_update_jobStatus(res,user,data,job_status_id){
    //     try{
    //         if(!job_status_id){
    //             data._company_id_fk = user.company_id;
    //             data.created_at = new Date();
    //             let create_query = await JobStatus.create(data);
    //             if(create_query){
    //                 let get_record = await get_job_status(user);
    //                 return {status:true,data:get_record}
    //             }
    //             else{
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) });
    //             }
    //         }
    //         else{
    //             let check_valid = await JobStatus.count({ where: { __job_status_id_pk: job_status_id, is_deleted: 0} })
    //             if (!check_valid) {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
    //             }

    //             let update_status = await JobStatus.update(data,{where:{__job_status_id_pk: job_status_id}});
    //             if(update_status){
    //                 let update_get_record = await get_job_status(user);
    //                 return {status:true,data:update_get_record}
    //             }
    //             else{
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_updated', user.lang) });
    //             }
    //         }
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // }

    // async function insert_update_resource(res, user, data, resource_id) {
    //     try {
    //         data = handy.transformnames('RTL', data, "Resource");
    //         if (!resource_id) {
    //             data._company_id_fk = user.company_id;
    //             data.created_by = user.company_id;
    //             data.created_at = new Date();
    //             let create_resource = await Resource.create(data);
    //             let get_created_id = create_resource.get("__resource_id_pk");
    //             if (get_created_id) {
    //                 const get_record = await get_resource(res, user, get_created_id);
    //                 return { status: true, data: get_record }
    //             }
    //             else {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) });
    //             }
    //         }
    //         else {
    //             let check_deleted = await Resource.count({ where: { __resource_id_pk: resource_id, is_deleted: 0 } })
    //             if (!check_deleted) {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
    //             }
    //             data.updated_by = user.company_id;
    //             let update_resource = await Resource.update(data, { where: { __resource_id_pk: resource_id } });
    //             if (update_resource) {
    //                 const get_record = await get_resource(res, user, resource_id);
    //                 return { status: true, data: get_record }
    //             }
    //             else {
    //                 res.status(501).send({ status: false, message: lang('Validation.record_not_updated', user.lang) });
    //             }
    //         }
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // }

    // fastify.post('/admin/jobstatus/create', async (req, res)=>{
    //     try{
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         let data_trans = handy.transformnames('RTL', req.body, "JobStatus");
    //         let create_js = await insert_update_jobStatus(res,user,data_trans);
    //         res.status(200).send(create_js);
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // })

    // fastify.post('/admin/staff/create', async (req, res) => {
    //     try {
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         let inpt_staff = handy.transformnames('RTL', req.body, "Auth");
    //         let ins_staff = await insert_update_staff(res, user, inpt_staff);
    //         res.status(200).send({ status: true, data: ins_staff })
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // })

    // fastify.post('/admin/resource/create', async (req, res) => {
    //     try {
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         const get_created = await insert_update_resource(res, user, req.body);
    //         res.status(200).send(get_created);
    //     }
    //     catch (e) {
    //         res.status(501).send(e);
    //     }
    // })

    // fastify.post('/admin/deliverycharge/create', async (req, res) => {
    //     try {
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         if (req.body) {
    //             const data = handy.transformnames('RTL', req.body, "DeliveryPrice");
    //             data._company_id_fk = user.company_id;
    //             data.created_by = user.user_id;
    //             data.created_at = new Date();
    //             const out_data = await DeliveryPrice.create(data);
    //             if (out_data.__delivery_price_id_pk) {
    //                 const res_data = await getDeliveryPriceByID(out_data.__delivery_price_id_pk );
    //                 res.status(200).send({ status: true, data: res_data });
    //             } else {
    //                 res.status(500).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) });
    //             }
    //         } else {
    //             res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
    //         }
    //     } catch (e) {
    //         res.status(501).send(e);
    //     }
    // });

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is usefull to get the Delivery Price by id
     * @param {price id} price_id 
     * @returns price data
     */
    async function getDeliveryPriceByID(price_id) {
        let data = await DeliveryPrice.findOne({ attributes: { exclude: ["_company_id_fk", "updated_at", "created_at", "updated_by", "created_by"] }, where: { __delivery_price_id_pk: price_id } });
        data = handy.transformnames('LTR', data, "DeliveryPrice");
        return data || {};
    }
    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is used for get all delivery price data
     * @param {company id} company_id 
     * @returns List of delivery price data
     */
    async function getDeliveryPrice(company_id) {
        let data = await DeliveryPrice.findAll({ attributes: { exclude: ["_company_id_fk", "updated_at", "created_at", "updated_by", "created_by"] }, where: { _company_id_fk: company_id } });
        data = handy.transformnames('LTR', data, "DeliveryPrice");
        return data || [];
    }

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is used to update tax data
     * @param {HTTP request} req 
     * @param {Logged in user data} user 
     * @returns status and updated data
     */
    async function create_update_tax(req, user) {
        let data = {};
        let tax_body = req.body;
        if (tax_body) {
            let item = handy.transformnames('RTL', tax_body, "TaxRate");
            item._company_id_fk = user.company_id;
            if (item.__tax_rate_id_pk) {
                item.updated_by = user.user_id;
                const count = await TaxRate.count({ where: { __tax_rate_id_pk: item.__tax_rate_id_pk } });
                if (!count)
                    return { status: false, message: lang('Validation.record_not_exist', user.lang) }
                await TaxRate.update(item, { where: { __tax_rate_id_pk: item.__tax_rate_id_pk } });
                data = await TaxRate.findOne({ attributes: Object.keys(item), where: { __tax_rate_id_pk: item.__tax_rate_id_pk } });
            } else {
                item.created_at = new Date();
                item.created_by = user.user_id;
                data = await TaxRate.create(item);
            }
            data = handy.transformnames('LTR', data, "TaxRate");
            delete data.company_id
            delete data.updated_by
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is used to update card data
     * @param {HTTP request} req 
     * @param {Logged in user data} user 
     * @returns status and updated data
     */
    async function create_update_cards(req, user) {
        let data = {};
        let card_body = req.body;
        if (card_body) {
            let item = handy.transformnames('RTL', card_body, "CreditCardRate");
            item._company_id_fk = user.company_id;
            if (item.__credit_card_rate_id_pk) {
                item.updated_by = user.user_id;
                const count = await CreditCardRate.count({ where: { __credit_card_rate_id_pk: item.__credit_card_rate_id_pk } });
                if (!count)
                    return { status: false, message: lang('Validation.record_not_exist', user.lang) }
                await CreditCardRate.update(item, { where: { __credit_card_rate_id_pk: item.__credit_card_rate_id_pk } });
                data = await CreditCardRate.findOne({ attributes: Object.keys(item), where: { __credit_card_rate_id_pk: item.__credit_card_rate_id_pk } });
            } else {
                item.created_at = new Date();
                item.created_by = user.user_id;
                data = await CreditCardRate.create(item);
            }
            data = handy.transformnames('LTR', data, "CreditCardRate");
            delete data.company_id
            delete data.updated_by
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
    * @deprecated 1.0.0
    * @author Kirankumar
    * @summary This function is used for update rate data
    * @param {HTTP request} req 
    * @param {Logged in user data} user 
    * @returns status and updated data
    */
    async function create_update_rate(req, user) {
        let data = {};
        if (req.body) {
            let rate_data = handy.transformnames('RTL', req.body, "Rate");
            if (rate_data.__rate_config_id_pk) {
                const count = await Rate.count({ where: { __rate_config_id_pk: item.__rate_config_id_pk } });
                if (!count)
                    return { status: false, message: lang('Validation.record_not_exist', user.lang) }
                await Rate.update(rate_data, { where: { __rate_config_id_pk: rate_data.__rate_config_id_pk } });
                data = await Rate.findOne({ attributes: Object.keys(rate_data), where: { __rate_config_id_pk: rate_data.__rate_config_id_pk } }) || {};
            } else {
                rate_data.compeny_id = user.company_id;
                rate_data.created_at = new Date();
                rate_data.created_by = user.user_id;
                data = await Rate.create(rate_data) || {};
            }
            data = handy.transformnames('LTR', data, "Rate")
            delete data.compeny_id;
            return { status: true, data };
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @param {bisiness id} id 
     * @param {updated fields} attributes
     * @returns business data
     */
    async function getBusinessByID(id, attributes) {
        const con = { where: { __business_id_pk: id } }
        if (attributes && attributes.length) {
            con.attributes = attributes;
        } else {
            con.attributes = { exclude: ["_company_id_fk", "updated_at", "created_at", "updated_by", "created_by", "is_deleted"] };
        }
        const data = await ConfigBusiness.findOne(con);
        return data || {};
    }
}

module.exports = AdminRouter;