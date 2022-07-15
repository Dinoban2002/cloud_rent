const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { numberWithCommas, setFormatedDate, floatnumberWithCommas } = require("../config/common");

module.exports = {
    /**
     * @author Kirankumar
     * @summary this function is used for place pdf content in side pdf doc
     * @param {pdf doc} doc 
     * @param {Input data} data 
     * @param {Logged in user data} user 
     * @returns doc
     */
    create: async function (doc, data, user) {
        const { pdf_date_format, colour_palette, currency, no_show_unit_price } = data.admin.dataValues;
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";
        let { company, address_billing, telephone } = data.client;
        const user_name = data.client ? data.client["staff.display_staff_name"] : "";
        const d = new Date().toDateString().split(" ");
        //calculated variable
        const {card_name, card_percentage} = data?.cardDetails||{};
        const { amount_paid, balance, discount, subtotal, total, tax, credit_card_charge} = data?.invoice_data?.invoice_calculated_data || {};
        const creation_date = setFormatedDate(data.invoice_data.date, pdf_date_format);
        let start_date = new Date(data.start_date).toDateString().split(" ");
        let end_date = new Date(data.end_date).toDateString().split(" ");
        if (start_date.length == 2) {
            start_date = "";
            end_date = "";
        } else {
            start_date = start_date[0] + " " + start_date[2] + " " + start_date[1] + " " + start_date[3];
            end_date = end_date[0] + " " + end_date[2] + " " + end_date[1] + " " + end_date[3];;
        }
        const page_width = doc.page.width - 13;
        const { delivery, pickup, collection } = data?.rental_data;
        //show status  
        let deliver_pickup = "";
        let collect_return = "";
        if (delivery == "yes" || pickup == "yes") {
            deliver_pickup = delivery == "yes" ? `DELIVERY` : `PICKUP`;
        } else {
            deliver_pickup = "";
        }
        if (collection == "yes" || data?.rental_data?.return == "yes") {
            collect_return = collection == "yes" ? `COLLECT` : `RETURN`;
        } else {
            collect_return = ""
        }
        const title = deliver_pickup && collect_return ? `${deliver_pickup} & ${collect_return}` : deliver_pickup + collect_return;
        //var
        const rental_start_date = setFormatedDate(data.start_date, pdf_date_format);
        const delivery_date = setFormatedDate(data?.rental_data?.delivery_date, pdf_date_format);
        const delivery_address = data?.rental_data?.delivery_address;
        const client_address = data.client.address_billing;
        const name = data.client.name_full;
        const phone = data.client.telephone;
        const account_name = data.client.account_name;
        const header_bgcolor = colour_palette || "#9dc940";  // table header background color
        const currency_type = currency || "R";
        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');


        doc.roundedRect(10, 120, 220, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').stroke();
        doc.fontSize(10);
        doc.font('Roboto-bold').text((account_name || " "), 20, 125, { width: 125, lineBreak: true }).stroke();
        doc.font("Roboto").fontSize(10);
        doc.font('Roboto').text((name || ""), 20, doc.y, { width: 125, lineBreak: true }).stroke();
        doc.text((client_address || "") + "\n" + (phone || ""), { width: 220, lineBreak: true });
        doc.fill('gray').stroke();
        doc.fill('black').stroke();
        //update
        doc.roundedRect(270, 120, 314, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').stroke();
        doc.fontSize(10);
        doc.font('Roboto-bold').text((title), 280, 125, { width: 125, lineBreak: true }).stroke();
        doc.font('Roboto-bold').text(("Rental Start: "), 280, doc.y, { width: 300, align: 'left', continued: true }).font("Roboto").text(rental_start_date || ` `).stroke();
        doc.font('Roboto-bold').text(("Delivery Date: "), 280, doc.y, { width: 300, align: 'left', continued: true }).font("Roboto").text(delivery_date || ` `).stroke();
        doc.font('Roboto-bold').text(("Delivery Address: "), 280, doc.y, { width: 300, align: 'left', continued: true }).font("Roboto").text(delivery_address || ` `).stroke();
        doc.font("Roboto").fontSize(10);
        doc.fill('gray').stroke();

        doc.fill('black').stroke();
        doc.fill('black').font('Roboto-italic').fontSize(12).text(("Invoice To:"), 30, 105, { width: 325, lineBreak: true }).stroke();
        //var
        let due_date = setFormatedDate(data?.invoice_data?.due_date, pdf_date_format);
        let terms = data?.rental_data?.config_term?.term_label;

        //update end
        doc.image('assets/crlogo.png', 12, 7, { width: 132, height: 85 });
        doc.font('Roboto-bold').fontSize(15).text(`TAX INVOICE ${data.invoice_id}`, 384, 10, { width: 200, align: 'right' });
        doc.fontSize(10);
        // created by
        let user_name_width = doc.widthOfString(user_name);
        let width_created_by = doc.widthOfString("Created by: ");
        let created_by = page_width - (user_name_width + width_created_by);
        doc.font('Roboto-bold').text(("Created by: "), created_by, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(user_name || "").stroke();

        // invoice date
        let invoice_date_value_width = doc.widthOfString(creation_date);
        let invoice_date_width = doc.widthOfString("Invoice Date: ");
        let invoice_date = page_width - (invoice_date_width + invoice_date_value_width);
        doc.font('Roboto-bold').text(("Invoice Date: "), invoice_date, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(creation_date || ` `).stroke();

        // due date
        let due_date_value_width = doc.widthOfString(due_date);
        let due_date_width = doc.widthOfString("Due Date: ");
        let date_due = page_width - (due_date_width + due_date_value_width);
        doc.font('Roboto-bold').text(("Due Date: "), date_due, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(due_date || "").stroke();

        // terms
        let term_value_width = doc.widthOfString(terms);
        let term_width = doc.widthOfString("Terms: ");
        let terms_x = page_width - (term_width + term_value_width);
        doc.font('Roboto-bold').text(("Terms: "), terms_x, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(terms || "").stroke();
        // Table 
        doc.moveDown(5);
        doc.text("", 1, 210);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "QTY", property: 'qty', align: 'center', width: 70, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "ITEM", property: 'item', align: 'left', width: 355, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "UNIT", property: 'unit', align: 'center', width: 84, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "AMOUNT", property: 'amount', align: 'right', width: 85, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
            ],
        }
        //add more fields unit_price in table
        if (!no_show_unit_price == 1) {
            table.headers.splice(3, 0, { label: "PRICE", property: 'price', align: 'center', width: 85, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },);
            table.headers[1].width = table.headers[1].width - table.headers[3].width;
        }
        table.datas = [];
        const body_data = data.invoice_data.invoice_items || [];
        //body_data.push(data.payment_list);
        for (let key in body_data) {
            const item = {
                qty: body_data[key].qty || 0,
                item: body_data[key].item || "",
                unit: body_data[key].units || 0,
                price: body_data[key].unit_price ? numberWithCommas(body_data[key].unit_price) : 0,
                amount: body_data[key]?.qty && body_data[key]?.unit_price ?
                    floatnumberWithCommas(
                        (
                            body_data[key]?.qty * (`${body_data[key]?.unit_price}`?.includes(",") ? body_data[key]?.unit_price?.replaceAll(",", "") : body_data[key]?.unit_price) * (body_data[key]?.units || 1)
                        )
                    )
                    : "0.00",
            }
            if (!(key % 2)) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1,
                }
            }

            table.datas.push(item);
        }

        const options = {
            x: 0, // {Number} default: undefined | doc.x
            y: 0, // {Number} default: undefined | doc.y
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 }
            }
        }
        await doc.table(table, options);
        const total_y = doc.y - 10
        // line
        doc.underline(0, 677, 600, 5, { color: '#bdbdbd' });

        // Add Bottom left content
        doc.font('Roboto').text("PAYING BY CREDIT CARD", 30, 685);
        doc.font('Roboto').text("NAME: ____________________________________ EXP: ___________", 30, 705);
        doc.font('Roboto').text("CARD NO: ____________________________________________________", 30, 722);
        doc.font('Roboto').text("CCV: _________ SIGN: ______________________________________", 30, 740);
        doc.fontSize(8).font('Roboto').text("If you are wishing to pay via BPAY, please contact us for our BPAY details.", 30, 760, { width: 240, align: 'left' }).opacity(0.5);

        // Footer's mid and right
        doc.opacity(0.7);
        doc.font('Roboto').text("BOND", 280, 685);;
        doc.font('Roboto').text("INSURANCE", 280, 695);
        doc.font('Roboto').text("DISCOUNT", 280, 705).opacity(1);
        doc.font('Roboto').text(data.invoice_data && data.invoice_data.bond ? currency_type + parseFloat(`${data?.invoice_data?.bond}`.includes(",")? data?.invoice_data?.bond?.replaceAll(",", ""): data?.invoice_data?.bond).toFixed(2) : currency_type + "0.00", 273, 685, { width: 110, align: 'right' });
        doc.font('Roboto').text(currency_type + "0.00", 273, 695, { width: 110, align: 'right' });
        doc.font('Roboto').text(discount ? currency_type + parseFloat(`${discount}`.includes(",") ? discount?.replaceAll(",", ""):discount).toFixed(2) : currency_type + "0.00", 273, 705, { width: 110, align: 'right' }).opacity(0.5);
        doc.opacity(0.7);
        doc.font('Roboto').text("SUBTOTAL", 403, 685);
        doc.font('Roboto').text(data?.invoice_data?.invoice_tax_data?.tax_code||"", 403, 695);
        doc.font('Roboto').text(card_name? card_name :"", 403, 705);
        doc.font('Roboto').text("PAID", 408, 730);
        doc.font('Roboto').text("BALANCE DUE", 408, 740);
        doc.font('Roboto').text(data?.invoice_data?.invoice_tax_data?.percentage ? data?.invoice_data?.invoice_tax_data?.percentage +'%' : "0%", 480, 695);
        doc.font('Roboto').text(card_name?card_percentage? card_percentage +'%' :"0%":` `, 480, 705).opacity(1);
        doc.font('Roboto').text(subtotal ? currency_type + parseFloat(`${subtotal}`.includes(",") ? subtotal?.replaceAll(",", ""): subtotal).toFixed(2) : currency_type + "0.00", 465, 685, { width: 100, align: 'right' });
        doc.font('Roboto').text(tax ? `${currency_type}${parseFloat(`${tax}`.includes(",")? tax?.replaceAll(",", ""):tax).toFixed(2)}` : currency_type + "0.00", 465, 695, { width: 100, align: 'right' });
        doc.font('Roboto').text(card_name? credit_card_charge ?`${currency_type}${parseFloat(`${credit_card_charge}`.includes(",")? credit_card_charge?.replaceAll(",", ""):credit_card_charge).toFixed(2)}` : currency_type + "0.00":` `, 465, 705, { width: 100, align: 'right' });
        doc.opacity(0.7)
        doc.fontSize(13).font('Roboto-bold').text("TOTAL", 408, 715).opacity(1);
        doc.font('Roboto-bold').text(total ? currency_type + parseFloat(`${total}`.includes(",")? total?.replaceAll(",", ""):total).toFixed(2) : currency_type + "0.00", 465, 715, { width: 100, align: 'right' }).fontSize(9);

        doc.font('Roboto').text(!isNaN(amount_paid) ? currency_type + parseFloat(`${amount_paid}`.includes(",")? amount_paid?.replaceAll(",", ""):amount_paid).toFixed(2) : currency_type + "0.00", 465, 730, { width: 100, align: 'right' });
        doc.font('Roboto').text(!isNaN(balance) ? currency_type + parseFloat(`${balance}`.includes(",")? balance?.replaceAll(",", ""):balance).toFixed(2) : currency_type + "0.00", 465, 740, { width: 100, align: 'right' });

        //this is footer for first page
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            if (data?.business_get) {
                doc.font('Roboto').fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
                    {
                        width: 450,
                        align: 'center',
                        lineBreak: false,
                    });
                doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 18,
                    {
                        width: 450,
                        lineBreak: false, align: "center",
                    });
            }
            // Reset text writer position
            doc.text('', 50, 50)
            doc.page.margins.bottom = bottom;
        }
        return doc;
    },
    file_name: async function (data) {
        Client.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
        const client = await Client.findOne({
            raw: true,
            attributes: ["company", "address_billing", "telephone", "name_full", "account_name"], where: { __client_id_pk: data?.rental_data?.client_id, is_deleted: 0 },
            include: {
                model: Auth,
                attributes: ["display_staff_name"]
            }
        });
        let name = "Rental Report - {{company}}.pdf";
        if (client) {
            name = name.replace("{{company}}", client.company);
        } else {
            name = name.replace("{{company}}", "");
        }
        return { file_name: name, client };
    }
}