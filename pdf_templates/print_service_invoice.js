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
        // pdf page width variable
        const page_width = doc.page.width - 13;

        //var for get data
        const { items, sub_total, tax, total, serviceData, created_at, rental_id, } = data?.service_invoice_data.data;
        const { address_billing, telephone, account_name, name_full, } = data?.client;
        const { percentage, tax_code } = data?.rental_get?.tax_rate ? data?.rental_get?.tax_rate : {};
        const { term_label } = data?.rental_get.config_term ? data?.rental_get.config_term : {};
        const { pdf_date_format, colour_palette, currency, no_show_unit_price } = data?.admin.dataValues;
        const { bond } = data?.rental_get || {};
        // heading variables
        const rental_Id = rental_id;
        const user_name = data.client['staff.display_staff_name'];
        const invoice_creation_date = setFormatedDate(created_at, pdf_date_format);
        let dueDate = setFormatedDate(serviceData?.due_date, pdf_date_format);
        let terms = term_label || "";

        // box variables
        const name_account = account_name || "";
        const name = name_full || "";
        const client_address = address_billing || "";
        const phone = telephone || "";
        // amount variables
        const bond_amount = bond || 0;
        const insurance_amount = 0;
        const discount_amount = serviceData?.discount_cash || 0;//discount
        const tax_name = tax_code;
        const tax_percent = percentage;
        const subtotal_amount = sub_total;
        const tax_amount = tax;
        const total_amount = total || 0;
        const paid_amount = serviceData?.amount_paid || 0;// paid
        const balance_due_amount = total - paid_amount;//total_due
        const header_bgcolor = colour_palette || "#9dc940";  // table header background color
        const currency_type = currency || "R";

        // var for footer data
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";

        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');

        // image 
        doc.image('assets/crlogo.png', 12, 7, { width: 132, height: 85 });

        // Tax Invoice title
        doc.font('Roboto-bold').fontSize(15).text(`TAX INVOICE ${rental_Id || ""}`, 384, 10, { width: 200, align: 'right' });
        doc.fontSize(10);
        // created by
        let user_name_width = doc.widthOfString(user_name);
        let width_created_by = doc.widthOfString("Created by: ");
        let created_by = page_width - (user_name_width + width_created_by);
        doc.font('Roboto-bold').text(("Created by: "), created_by, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(user_name || ` `).stroke();

        // invoice date
        let invoice_date_value_width = doc.widthOfString(invoice_creation_date);
        let invoice_date_width = doc.widthOfString("Invoice Date: ");
        let invoice_date = page_width - (invoice_date_width + invoice_date_value_width);
        doc.font('Roboto-bold').text(("Invoice Date: "), invoice_date, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(invoice_creation_date || ` `).stroke();

        // due date
        let due_date_value_width = doc.widthOfString(dueDate);
        let due_date_width = doc.widthOfString("Due Date: ");
        let date_due = page_width - (due_date_width + due_date_value_width);
        doc.font('Roboto-bold').text(("Due Date: "), date_due, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(dueDate || ` `).stroke();

        // terms
        let term_value_width = doc.widthOfString(terms);
        let term_width = doc.widthOfString("Terms: ");
        let terms_x = page_width - (term_width + term_value_width);
        doc.font('Roboto-bold').text(("Terms: "), terms_x, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto").text(terms || ` `).stroke();

        // invoice to 
        doc.fill('black').stroke();
        doc.fill('black').font('Roboto-italic').fontSize(12).text(("Invoice To:"), 30, 105, { width: 325, lineBreak: true }).stroke();

        // top-left-side box
        doc.roundedRect(10, 120, 220, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').stroke();
        doc.fontSize(10);
        doc.font('Roboto-bold').text((name_account || " "), 20, 125, { width: 125, lineBreak: true }).stroke();
        doc.font("Roboto").fontSize(10);
        doc.font('Roboto').text((name || ""), 20, doc.y, { width: 125, lineBreak: true }).stroke();
        doc.text((client_address || "") + "\n" + (phone || ""), { width: 220, lineBreak: true });
        doc.fill('black').stroke();

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
        const body_data = items;
        for (let key in body_data) {
            const item = {
                qty: body_data[key]?.qty || 0,
                item: body_data[key]?.item || "",
                unit: body_data[key]?.units || 0,
                price: body_data[key]?.unit_price ? numberWithCommas(body_data[key]?.unit_price) : 0,
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
        doc.font('Roboto').text("NAME: _____________________________________ EXP: ____________", 30, 705);
        doc.font('Roboto').text("CARD NO: ____________________________________________________", 30, 722);
        doc.font('Roboto').text("CCV: __________ SIGN: _______________________________________", 30, 740);
        doc.fontSize(8).font('Roboto').text("If you are wishing to pay via BPAY, please contact us for our BPAY details.", 30, 760, { width: 240, align: 'left' }).opacity(0.5);

        // Footer's mid and right
        doc.opacity(0.7);
        doc.font('Roboto').text("BOND", 280, 685);;
        doc.font('Roboto').text("INSURANCE", 280, 695);
        doc.font('Roboto').text("DISCOUNT", 280, 705).opacity(1);
        doc.font('Roboto').text(bond_amount ? `${currency_type}${parseFloat(`${bond_amount}`?.includes(",") ? bond_amount?.replaceAll(",", "") : bond_amount).toFixed(2)}` : currency_type + "0.00", 265, 685, { width: 125, align: 'right' });
        doc.font('Roboto').text(insurance_amount ? `${currency_type}${parseFloat(`${insurance_amount}`?.includes(",") ? insurance_amount?.replaceAll(",", "") : insurance_amount).toFixed(2)}` : currency_type + "0.00", 265, 695, { width: 125, align: 'right' });
        doc.font('Roboto').text(discount_amount ? `${currency_type}${parseFloat(`${discount_amount}`.includes(",") ? discount_amount?.replaceAll(",", "") : discount_amount).toFixed(2)}` : currency_type + "0.00", 265, 705, { width: 125, align: 'right' }).opacity(0.5);
        doc.opacity(0.7);
        doc.font('Roboto').text("SUBTOTAL", 403, 685);
        doc.font('Roboto').text(tax_name || "", 403, 695);

        doc.font('Roboto').text("PAID", 408, 730);
        doc.font('Roboto').text("BALANCE DUE", 408, 740);
        doc.font('Roboto').text(tax_percent ? tax_percent + '%' : '%', 480, 695).opacity(1);

        doc.font('Roboto').text(subtotal_amount ? `${currency_type}${parseFloat(`${subtotal_amount}`.includes(',') ? subtotal_amount.replaceAll(",", "") : subtotal_amount).toFixed(2)}` : currency_type + "0.00", 465, 685, { width: 100, align: 'right' });
        doc.font('Roboto').text(tax_amount ? `${currency_type}${parseFloat(`${tax_amount}`.includes(",") ? tax_amount.replaceAll(",", "") : tax_amount).toFixed(2)}` : currency_type + "0.00", 465, 695, { width: 100, align: 'right' });

        doc.opacity(0.7)
        doc.fontSize(13).font('Roboto-bold').text("TOTAL", 408, 715).opacity(1);
        doc.font('Roboto-bold').text(total_amount ? `${currency_type}${parseFloat(`${total_amount}`.includes(",") ? total_amount.replaceAll(",", "") : total_amount).toFixed(2)}` : currency_type + "0.00", 465, 715, { width: 100, align: 'right' }).fontSize(9);

        doc.font('Roboto').text(paid_amount ? `${currency_type}${parseFloat(`${paid_amount}`.includes(",") ? paid_amount.replaceAll(",", "") : paid_amount).toFixed(2)}` : currency_type + "0.00", 465, 730, { width: 100, align: 'right' });
        doc.font('Roboto').text(balance_due_amount ? `${currency_type}${parseFloat(`${balance_due_amount}`.includes(",") ? balance_due_amount.replaceAll(",", "") : balance_due_amount).toFixed(2)}` : currency_type + "0.00", 465, 740, { width: 100, align: 'right' });

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
            attributes: ["company", "address_billing", "telephone", "account_name", "name_full"], where: { __client_id_pk: data?.service_invoice_data?.data?.client_id, is_deleted: 0 },
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