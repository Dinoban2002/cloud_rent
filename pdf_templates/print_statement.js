const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { setFormatedDate } = require("../config/common");
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
        const { pdf_date_format, colour_palette, currency } = data.admin.dataValues;
        const header_bgcolor = colour_palette || "#9dc940";  // table header background color
        const currency_type = currency || "R";
        let { company, address_billing, telephone } = data.client;
        let { x, y, width } = data;
        let ti = 0, tp = 0;
        const user_name = data.client ? data.client["staff.display_staff_name"] : "";
        const creation_date = setFormatedDate(new Date(), pdf_date_format);
        let start_date = setFormatedDate(data.start_date, pdf_date_format);
        let end_date = setFormatedDate(data.end_date, pdf_date_format);

        const page_width = doc.page.width - 21.89;
        //left corner box x =10 y = 15 width = 200 height = 80 radious = 5

        //var for dynamic footer
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";

        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');

        doc.roundedRect(10, 15, 235, 80, 5).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').stroke();
        doc.fontSize(16);
        doc.font('Roboto-bold').text((company || "Linga"), 15, 25, { width: 125, lineBreak: true }).stroke();
        doc.font("Roboto").fontSize(10);
        doc.text((address_billing || "") + "\n" + (telephone || ""), { width: 220, lineBreak: true });
        doc.fill('gray').stroke();
        doc.text("0 to 14 DAYS", 10, 110, { width: 67.7, align: 'center' });
        doc.text("15 to 30 DAYS", 78.6, 110, { width: 67.7, align: 'center' });
        doc.text("31 to 45 DAYS", 147.2, 110, { width: 67.7, align: 'center' });
        doc.text("46 to 60 DAYS", 215.8, 110, { width: 67.7, align: 'center' });
        doc.text("+60 DAYS", 284.4, 110, { width: 67.7, align: 'center' });
        doc.fill('black').stroke();
        doc.rect(10, 121, 67.7, 18).strokeColor("#bfbfbf");
        doc.rect(78.6, 121, 67.7, 18).stroke();
        doc.rect(147.2, 121, 67.7, 18).stroke();
        doc.rect(215.8, 121, 67.7, 18).stroke();
        doc.rect(284.4, 121, 67.7, 18).stroke();
        doc.font("Roboto-bold").text(currency_type + data.client_calculation.to14, 10, 126, { width: 67.7, align: 'center' });
        doc.font("Roboto-bold").text(currency_type + data.client_calculation.to30, 78.6, 126, { width: 67.7, align: 'center' });
        doc.font("Roboto-bold").text(currency_type + data.client_calculation.to45, 147.2, 126, { width: 67.7, align: 'center' });
        doc.font("Roboto-bold").text(currency_type + data.client_calculation.to60, 215.8, 126, { width: 67.7, align: 'center' });
        doc.font("Roboto-bold").text(currency_type + data.client_calculation.plus60, 284.4, 126, { width: 67.7, align: 'center' });
        const user_name_width = doc.widthOfString(user_name);
        const create_date_width = doc.widthOfString(creation_date);
        const start_end_date_width = doc.widthOfString(start_date + " - " + end_date);
        doc.image('assets/crlogo.png', 700, 5, { width: 130, height: 85 });
        doc.font('Roboto-bold').fontSize(13).text("STATEMENT", 720, 99, { width: 100, align: 'right' });
        doc.fontSize(10);
        const width_created_by = doc.widthOfString("Created by: ");
        const width_create_date = doc.widthOfString("Creation Date: ");
        const width_start_end_date = doc.widthOfString("Period: ");
        const created_by = page_width - (user_name_width + width_created_by);
        doc.text("Created by: ", created_by, doc.y - 3, { width: (user_name_width + width_created_by + 0.1), align: 'left', continued: true }).font("Roboto").text(user_name);
        const create_date = page_width - (create_date_width + width_create_date);
        doc.font('Roboto-bold').text("Creation Date: ", create_date, doc.y, { width: (create_date_width + width_create_date + 0.1), align: 'left', continued: true }).font("Roboto").text(creation_date);
        const period_width = page_width - (start_end_date_width + width_start_end_date);
        if (data.start_date != "" && data.end_date != "") {
            doc.font('Roboto-bold').text(" Period: ", period_width, doc.y, { width: (start_end_date_width + width_start_end_date + 0.1), align: 'left', continued: true });
            doc.font("Roboto").text(start_date + " - " + end_date, { width, align: 'left' });
        }

        doc.moveDown(5);
        doc.text("", 1, 158);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "DATE", property: 'date', align: 'left', width: 85, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
                { label: "ID", property: 'invoice_id', align: 'left', width: 70, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
                { label: "TYPE", property: 'type', align: 'left', width: 70, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
                { label: "DESCRIPTION", property: 'description', align: 'left', width: 370, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
                { label: "INVOICES", property: 'total', align: 'left', width: 85, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
                { label: "PAYMENTS", property: 'payment_amount', align: 'left', width: 85, headerColor: header_bgcolor, color: "#ffffff", headerOpacity: "1", padding: 10, renderer: null },
                { label: "TOTAL", property: 'all_total', align: 'center', width: 80, headerColor: header_bgcolor, headerOpacity: "1", color: "#ffffff", padding: 10, renderer: null },
            ],
        }
        table.datas = [{ date: { label: new Date().toJSON().split("T")[0], options: { fontFamily: 'Roboto-italic' } }, invoice_id: "", type: "", payment_amount: "", description: { label: "Balance brought forward", options: { fontFamily: 'Roboto-italic' } }, total: "", all_total: { label: currency_type + "0.00", options: { fontFamily: 'Roboto-italic' } } }];
        const body_data = [...data.invoice_list, ...data.payment_list];
        //body_data.push(data.payment_list);
        for (let key in body_data) {
            const item = {
                date: body_data[key].date || "",
                invoice_id: body_data[key].__invoice_id_pk || body_data[key].__payment_id_pk || "000000",
                type: body_data[key].type || body_data[key].payment_type || "",
                description: "",
                total: body_data[key].total ? currency_type + body_data[key].total : "",
                payment_amount: body_data[key].payment_amount ? currency_type + body_data[key].payment_amount : "",
                all_total: body_data[key].total ? currency_type + body_data[key].total + " CR" : currency_type + "0.00",
            }
            if (!(key % 2)) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1
                }
            }
            if (body_data[key].__invoice_id_pk) {
                ti += body_data[key].total;
            } else {
                tp += body_data[key].payment_amount;
            }
            table.datas.push(item);
        }
        const options = {
            x: 0, // {Number} default: undefined | doc.x
            y: 0, // {Number} default: undefined | doc.y
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 }
            }
        }
        await doc.table(table, options);
        const total_y = doc.y - 10

        const total_bal = data.client_calculation.bal ? currency_type + parseFloat(data.client_calculation.bal).toFixed(2) + " CR" : currency_type + "0.00 CR";
        doc.strokeColor("#bfbfbf")
        doc.rect(595, total_y, 85, 15).stroke();
        doc.text(currency_type + parseFloat(ti).toFixed(2), 605, (doc.y - 5), { width: 85, align: 'left' });

        doc.rect(680, total_y, 85, 15).stroke();
        doc.text(currency_type + parseFloat(tp).toFixed(2), 690, (doc.y - 10), { width: 85, align: 'left' });

        doc.rect(765, total_y, 80, 15).stroke();
        doc.font('Roboto-bold').text(total_bal, 765, (doc.y - 9), { width: 80, align: 'center' });

        //add divider line
        doc.moveTo(0, doc.y + 10)
            .lineTo(doc.page.width, doc.y + 10)
            .dash(3, { space: 3 })
            .opacity(0.5)
            .stroke();
        doc.opacity(1);
        // Add Bottom left content
        doc.font('Roboto').text("PAYING BY CREDIT CARD", 10, doc.y + 15);//470
        doc.font('Roboto').text("NAME: _______________________________ EXP: ___________", 10, doc.y + 5);//485
        doc.font('Roboto').text("CARD NO: _____________________________________________", 10, doc.y + 5);//500
        doc.font('Roboto').text("CCV: ________ SIGN: __________________________________", 10, doc.y + 5);//515
        doc.moveDown();
        doc.font('Roboto').text("PAYING BY EFT - BANK: ", 10, doc.y,{align: 'left', continued: true }).font('Roboto-bold').text(data.admin && data.admin.bank_name ? data.admin.bank_name : ` `);//535
        doc.font('Roboto').text("ACCOUNT NAME: ", 10, doc.y,{ align: 'left', continued: true }).font('Roboto-bold').text(data.admin && data.admin.bank_account_name ? data.admin.bank_account_name : ` `);//545
        doc.font('Roboto').text("BSB: ", 10,doc.y,{ align: 'left', continued: true }).font('Roboto-bold').text(data.admin && data.admin.bank_account_bsb ? data.admin.bank_account_bsb : ` `,{continued:true})
        .font('Roboto').text(" ACCOUNT NO: ", 30,doc.y,{ align: 'left', continued: true }).font('Roboto-bold').text(data.admin && data.admin.bank_account_number ? data.admin.bank_account_number : ` `);//555
        doc.dash(doc.page.width,0);
        doc.rect(600, doc.y-26, 230, 30).stroke();
        doc.fontSize(18).text("Total Due: ", 608, doc.y -22, { width: 230, align: 'left', continued: true }).fillColor('#ad0800')
            .text(total_bal);
        doc.strokeColor("#000000")
        //this is footer for this page
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            if (data?.business_get) {
                doc.font('Roboto').fillColor('black').opacity(1).fontSize(9).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
                    {
                        width: 450,
                        align: 'center',
                        lineBreak: false,
                    });
                doc.font('Roboto').fontSize(9).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 18,
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
            attributes: ["company", "address_billing", "telephone"], where: { __client_id_pk: data.client_id, is_deleted: 0 },
            include: {
                model: Auth,
                attributes: ["display_staff_name"]
            }
        });
        let name = "Statement Report - {{company}}.pdf";
        if (client) {
            name = name.replace("{{company}}", client.company);
        } else {
            name = name.replace("{{company}}", "");
        }
        return { file_name: name, client };
    }
}
