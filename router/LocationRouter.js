var commonchange = require("../config/common");
const { ConfigLocation } = require("../models/Model")(["ConfigLocation"]);
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;

async function LocationRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary this rout is used for update location data
     * @returns status and updated data
     */
    fastify.post('/location/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, ConfigLocation, "ConfigLocation", "__config_location_id_pk");
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(fastify.appCache, "location_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for delete the location record
     * @returns status and message
     */
    fastify.delete('/location/delete/:location_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.location_id) {
                var deleteRecord = await ConfigLocation.update({ is_active: 0 }, { where: { __config_location_id_pk: req.params.location_id, _company_id_fk: user.company_id } })
                if (deleteRecord && deleteRecord[0]) {
                    res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                    handy.cacheDel(fastify.appCache, "location_list", user, "company_" + user.company_id + "_drop_down_data");
                }
                else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })
}
module.exports = LocationRouter;