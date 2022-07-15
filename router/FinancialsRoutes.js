const { QuickNavigationPOS, Invoice, InvoiceItems, TaxRate, Client, Administration } = require("../models/Model")(
    ["Invoice", "InvoiceItems", "TaxRate", "QuickNavigationPOS", "Client", "Administration"]
);
const { Sequelize, where } = require('sequelize');
const Op = Sequelize.Op;
const sequelize = require("../config/database");
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;

async function FinancialsRouter(fastify, opts) {

    fastify.post('/financials/invoice/list', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            var { where, attributes, order } = await handy.grid_filter(req.body, "Invoice", false, user.company_id);
            where.type = "INVOICE";
            let condition = {where, order }
            attributes = handy.setDateFormat(attributes, ["date"], user.date_format);
            if (!attributes.indexOf("__invoice_id_pk") >= 0)
                attributes.push("__invoice_id_pk");
            condition.attributes = attributes;

            let client_conditions = {};
                if (attributes.indexOf("name_full") >= 0)
                {
                    attributes.splice(attributes.indexOf("name_full"), 1)
                    client_conditions.attributes = ["name_full"];
                    client_conditions.model = Client;
                    for (orer_key in condition.order) {
                        if (condition.order[orer_key][0] == "name_full") {
                            client_conditions.order = condition.order[orer_key];
                            condition.order.splice(orer_key, 1)
                            break;
                        }
                    }
                }
            condition.include = [];
            if (Object.keys(client_conditions).length) {
                condition.include.push(client_conditions);
            }
            Invoice.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', })
            const res_data = await Invoice.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Invoice", { client: "Client"});
            res.status(200).send({ status: true, count: res_data.count,data });
        } catch (e) {
            res.status(501).send(e);
        }
    })
}
module.exports = FinancialsRouter;