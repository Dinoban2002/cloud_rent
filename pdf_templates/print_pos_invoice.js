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

        // //var for get data
        const { amount_paid, balance, discount, subtotal, tax, total, credit_card_charge } = data?.invoice_calculated_data;

        const { invoice_id, date, items, due_date, config_term, comments, tax_rate } = data?.invoiceData || {};
        const { percentage, tax_code } = tax_rate ? tax_rate : {};
        const { pdf_date_format, colour_palette, currency, no_show_unit_price, bank_name, bank_account_name, bank_account_bsb, bank_account_number } = data?.admin.dataValues;

        const { address_billing, telephone, name_full, account_name } = data?.client || {};

        // heading variables
        const invoice_Id = invoice_id || "";
        const user_name = data?.client['staff.display_staff_name'] || "";
        const invoice_creation_date = setFormatedDate(date, pdf_date_format);;
        let dueDate = setFormatedDate(due_date, pdf_date_format);;
        let terms = config_term?.term_label || "";

        //left box variables
        const name_account = account_name || "";
        const name = name_full || "";
        const client_address = address_billing || "";
        const phone = telephone || "";

        //right box variables
        const invoice_comment = comments || "";

        // amount variables
        const bond_amount = 0;
        const insurance_amount = 0;
        const tax_name = tax_code;
        const tax_percent = percentage || "0";
        const subtotal_amount = subtotal;
        const tax_amount = tax;
        const total_amount = total || 0;
        const paid_amount = isNaN(amount_paid) ? 0 : amount_paid;
        const balance_due_amount = total_amount - paid_amount;
        const header_bgcolor = colour_palette || "#9dc940";  // table header background color
        const currency_type = currency || "R";
        // const discount_amount = 0;//discount

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
        doc.image('./assets/industry.png', 12, 7, { width: 85, height: 85 });

        // Tax Invoice title
        doc.font('Roboto-bold').fontSize(15).text(`TAX INVOICE ${invoice_Id || ""}`, 384, 10, { width: 200, align: 'right' });
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

        // top-right-side box
        doc.roundedRect(270, 120, 312, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').fontSize(10).stroke();
        let comments_value_width = doc.widthOfString(invoice_comment);
        let comments_width = doc.widthOfString("Comments: ");
        let comments_x = page_width - (comments_width + comments_value_width + 5);
        doc.font('Roboto').text(("Comments: "), comments_x, 125, { width: 300, align: 'left', continued: true }).font('Roboto').text(invoice_comment || "").stroke();
        doc.fill('black').stroke();

        //function for calculate the amount
        const calculateAmount = async (item) => {
            let total_amount = (item.qty * item.unit_price * item.units) || 0;
            let disc_amount = (total_amount * item.discount_rate) || 0;
            let amount = (total_amount - disc_amount);
            amount = floatnumberWithCommas(
                (
                    `${amount}`?.includes(",") ?
                        amount.replaceAll(",", "")
                        : amount
                )
            )
            return amount;
        };
        //function for calculate the discount amount
        const discountAmount = async (item) => {
            let total_amount = (item.qty * item.unit_price * item.units) || 0;
            let disc_amount = (total_amount * item.discount_rate) || 0;
            disc_amount = floatnumberWithCommas(
                (
                    `${disc_amount}`?.includes(",") ?
                        disc_amount.replaceAll(",", "")
                        : disc_amount
                )
            )
            return disc_amount || 0;
        };
        // Table 
        doc.moveDown(5);
        doc.text("", 1, 210);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "QTY", property: 'qty', align: 'center', width: 50, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "ITEM", property: 'item', align: 'left', width: 300, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "DISC %", property: 'disc_rate', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "DISC", property: 'disc_amount', align: 'center', width: 70, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "UNIT", property: 'unit', align: 'center', width: 40, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "AMOUNT", property: 'amount', align: 'right', width: 70, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
            ],
        }
        // add more fields unit_price in table
        if (!no_show_unit_price == 1) {
            table.headers.splice(5, 0, { label: "PRICE", property: 'price', align: 'center', width: 65, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },);
            table.headers[1].width = table.headers[1].width - table.headers[5].width;
        }
        table.datas = [];
        const body_data = items;
        for (let key in body_data) {
            const item = {
                qty: body_data[key]?.qty || 0,
                item: body_data[key]?.item || "",
                disc_rate: body_data[key]?.discount_rate ? (body_data[key]?.discount_rate * 100) + "%" : "0%",
                disc_amount: await discountAmount(body_data[key]) || "0.00",
                unit: body_data[key]?.units || 0,
                price: body_data[key]?.unit_price ? numberWithCommas(body_data[key]?.unit_price) : 0,
                amount: await calculateAmount(body_data[key]) || "0.00",
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
            x: 0,
            y: 0,
            divider: {
                header: { disabled: true, width: 2, opacity: 1 },
                horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 }
            }
        }
        await doc.table(table, options);
        doc.moveDown(2);
        // line
        doc.underline(0, doc.y, 600, 5, { color: '#bdbdbd' });
        const cont_y = doc.y + 10;
        // Add Bottom left content
        doc.font('Roboto').text("PAYING BY CREDIT CARD", 30, doc.y + 10);
        doc.font('Roboto').text("NAME: _____________________________________ EXP: ____________", 30, doc.y);
        doc.font('Roboto').text("CARD NO: ____________________________________________________", 30, doc.y);
        doc.font('Roboto').text("CCV: __________ SIGN: _______________________________________", 30, doc.y);

        doc.moveDown();
        doc.font('Roboto').text("PAYING BY EFT - BANK: ", 30, doc.y, { align: 'left', continued: true }).font('Roboto-bold').text(bank_name ? bank_name : ` `);
        doc.font('Roboto').text("ACCOUNT NAME: ", 30, doc.y, { align: 'left', continued: true }).font('Roboto-bold').text(bank_account_name ? bank_account_name : ` `);
        doc.font('Roboto').text("BSB: ", 30, doc.y, { align: 'left', continued: true }).font('Roboto-bold').text(bank_account_bsb ? bank_account_bsb : ` `, { continued: true })
            .font('Roboto').text(" ACCOUNT NO: ", 50, doc.y, { align: 'left', continued: true }).font('Roboto-bold').text(bank_account_number ? bank_account_number : ` `);

        // Footer's mid and right
        doc.opacity(0.7);
        doc.font('Roboto').text("BOND", 280, cont_y);
        doc.font('Roboto').text("INSURANCE", 280, doc.y);

        doc.font('Roboto').opacity(1).text(bond_amount ? `${currency_type}${parseFloat(`${bond_amount}`?.includes(",") ? bond_amount?.replaceAll(",", "") : bond_amount).toFixed(2)}` : currency_type + "0.00", 265, cont_y, { width: 110, align: 'right' });
        doc.font('Roboto').text(insurance_amount ? `${currency_type}${parseFloat(`${insurance_amount}`?.includes(",") ? insurance_amount?.replaceAll(",", "") : insurance_amount).toFixed(2)}` : currency_type + "0.00", 265, doc.y, { width: 110, align: 'right' });

        doc.font('Roboto').opacity(0.7).text("SUBTOTAL", 405, cont_y, { lineBreak: false }).opacity(1).text(subtotal_amount ? `${currency_type}${parseFloat(`${subtotal_amount}`.includes(',') ? subtotal_amount.replaceAll(",", "") : subtotal_amount).toFixed(2)}` : currency_type + "0.00", { align: 'right' });

        doc.font('Roboto').opacity(0.7).text(tax_name || "GST", 405, doc.y - 1, { lineBreak: false }).text(tax_percent ? tax_percent + '%' : '0%', 480, doc.y, { width: 120, align: 'left', lineBreak: false }).opacity(1).text(tax ? `${currency_type}${parseFloat(`${tax}`.includes(",") ? tax?.replaceAll(",", "") : tax).toFixed(2)}` : currency_type + "0.00", 0, doc.y - 10, { align: 'right' });

        doc.font('Roboto-bold').fontSize(13).opacity(0.7).text(("TOTAL"), 408, doc.y + 12, { lineBreak: false }).opacity(1).text(total_amount ? `${currency_type}${parseFloat(`${total_amount}`.includes(",") ? total_amount.replaceAll(",", "") : total_amount).toFixed(2)}` : currency_type + "0.00", { align: "right" }).stroke();

        doc.font("Roboto").fontSize(8).opacity(0.7);
        doc.text(("PAID :"), 408, doc.y, { lineBreak: false }).opacity(1).text(paid_amount ? `${currency_type}${parseFloat(`${paid_amount}`.includes(",") ? paid_amount.replaceAll(",", "") : paid_amount).toFixed(2)}` : currency_type + "0.00", { align: "right" }).stroke();

        doc.opacity(0.7).text(("BALANCE DUE"), 408, doc.y - 1, { lineBreak: false }).opacity(1).text(balance_due_amount ? `${currency_type}${parseFloat(`${balance_due_amount}`.includes(",") ? balance_due_amount.replaceAll(",", "") : balance_due_amount).toFixed(2)}` : currency_type + "0.00", { align: "right" }).opacity(1);

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
            attributes: ["company", "address_billing", "telephone", "account_name", "name_full", "email"], where: { __client_id_pk: data?.invoiceData?.client_id, is_deleted: 0 },
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