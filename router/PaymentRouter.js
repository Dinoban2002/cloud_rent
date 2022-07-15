const { Payment, TaxRate, Rental } = require("../models/Model")(
    ["Payment", "TaxRate", "Rental"]
);
const { Invoice } = require("../config/columnmodify");
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;
/**
 * Routs for Payments
 * @param {*} fastify 
 * @param {*} opts 
 */
async function PaymentRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout used to get the payment list for rental
     * @input  {rental_id} rental id,
     * @returns Status and List of payments
     * 
     */
    fastify.post('/payment/get', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && (req.body.rental_id || req.body.client_id)) {
                const query = {};
                if (req.body.rental_id) {
                    query._rental_id_fk = req.body.rental_id;
                } else {
                    query._client_id_fk = req.body.client_id;
                }
                let data = await Payment.findAll({ where: query });
                data = await handy.transformnames('LTR', data, "Payment", {}, user);
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used to create the payment
     * @input  {data} payment data,
     * @returns Status and created data
     */
    fastify.post('/payment/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_payment(req.body, user)
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function used for create payment.
     * @param {payment data} data 
     * @param {logged in user data} user 
     * @returns status and created payment data
     */
    async function create_payment(data, user) {
        if (data) {
            const invoice_id = data.invoice_id;
            let summary = "";
            let payment_amount = data.payment_amount;
            if (!payment_amount) {
                return { status: true, alert: "Please add a payment amount to the payment" }
            }
            if (!data.payment_method) {
                return { status: true, alert: "Please add a payment method to the payment" }
            }
            summary = "Total payment of " + payment_amount + " paid by " + data.payment_method + " received on " + data.payment_date + " by " + user.username
            if (invoice_id) {
                const invoice = await handy.calculate_invoice_update(invoice_id, user, false, true);
                let { total, amount_paid: applied = 0, balance: invbal, invoice_id_no } = invoice;
                const paybal = payment_amount;
                if (invbal <= 0) {
                    return { status: true, alert: "This invoice has been paid" }
                }
                if (paybal <= 0) {
                    return { status: true, alert: "There is no Balance remaining to apply!" }
                }
                if ((paybal == total) || (invbal <= paybal && applied < 1)) {
                    data.comments = `PAID INFULL ${invoice_id_no} - ${summary}`;
                } else if (invbal <= paybal && applied >= 1) {
                    data.comments = `PAID BALANCE ${invoice_id_no} - ${summary}`;
                } else if (invbal > paybal) {
                    data.comments = `Paid: PART PAYMENT ${invoice_id_no} - ${summary}`;
                }
            }

            if (!data.payment_type)
                data.payment_type = "PAYMENT";
            // if (!data.comments)
            //     data.comments = "PAID BALANCE " + invoice_id + " - " + summary;
            data.is_updated = 1;
            if (data.rental_id) {
                Rental.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' })
                const rental = await Rental.findOne({
                    raw: true,
                    attributes: ["_tax_rate_id_fk"], where: { __rental_id_pk: data.rental_id }, include: {
                        model: TaxRate,
                        attributes: ["percentage", "tax_code"]
                    }
                });
                if (rental && rental["tax_rate.percentage"]) {
                    let tax = rental["tax_rate.percentage"] < 1 ? rental["tax_rate.percentage"] : rental["tax_rate.percentage"] / 100;
                    data.tax_rate = tax;
                    data.tax_label = rental["tax_rate.tax_code"];
                    data.tax_amount = (data.payment_amount - (data.payment_amount / (1 + tax)));
                }
            }
            data = await handy.create_update_table(data, user, Payment, "Payment", "__payment_id_pk")
            let invoice_calculation = {};
            if (invoice_id) {
                invoice_calculation = await handy.calculate_invoice_update(invoice_id, user, true);
            }
            if (data.client_id) {
                await handy.client_calculations(data.client_id, user, true);
            }
            if (data.data)
                data.data.invoice_calculation = invoice_calculation;
            return data;
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout used to update the payment
     * @input  {payment_id} payment id,
     * @returns Status and updated data
     */
    fastify.post('/payment/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.payment_id) {
                const data = await handy.create_update_table(req.body, user, Payment, "Payment", "__payment_id_pk")
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used to delete the payment
     * @input  {rental_id} rental id,
     * @returns Status and List of payments
     * 
     */
    fastify.delete('/payment/delete/:payment_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.payment_id) {
                const payment_data = await Payment.findByPk(req.params.payment_id);
                if (payment_data) {
                    const count = await Payment.destroy({ where: { __payment_id_pk: req.params.payment_id } });
                    let invoice_calculation = {};
                    if (count) {
                        if (payment_data._client_id_fk)
                            await handy.client_calculations(payment_data._client_id_fk, user, true);
                        if (payment_data._invoice_id_fk)
                            invoice_calculation = await handy.calculate_invoice_update(payment_data._invoice_id_fk, user, true);
                    }
                    //const responds = await handy.getInvoice(0,payment_data._invoice_id_fk,0,user);
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang), invoice_calculation });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used to get the payment by payment  id
     * @input  {rental_id} rental id,
     * @returns Status and payment data
     * 
     */
    fastify.get('/payment/get/:payment_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.payment_id) {
                let data = await Payment.findOne({ where: { __payment_id_pk: req.params.payment_id } });
                if (data) {
                    data = await handy.transformnames('LTR', data, "Payment", {}, user);
                    res.status(200).send({ status: true, data });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
    * @author Kirankumar
    * @summary This rout used to create pdf and will send mail body and subject
    * @returns status and pdf ref  and mail body and subject
    */
    fastify.post('/payment/mail', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //const data = await handy.get_pdf(req.body, user);
            //need to do later
            let data = {
                status: true, data: {
                    ref_id: "170da40a-b1ed-4bd2-b94c-0356692c9d7a",
                    mail_subject: "Payment Receipt",
                    mail_body: `Hi\n\nPlease find enclosed a receipt for your payment. \n\nKind regards \n\nDEVELOPER \nCloud Demo Software \n07 5607 1296 \nsales@cloudrent.me`
                }
            }
            if (!(req.body && req.body.payment_id)) {
                data = { status: false, message: lang('Validation.invalid_data', user.lang) }
            }
            if (data.status) {
                res.status(200).send(data)
            } else {
                res.status(500).send(data)
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

}
module.exports = PaymentRouter;