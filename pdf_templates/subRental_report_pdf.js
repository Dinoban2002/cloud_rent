const { numberWithCommas, setFormatedDate } = require("../config/common");
let handy = require("../config/common");
module.exports = {
    /**
     * @author Kirankumar
     * @summary this function is used for place pdf content in side pdf doc
     * @param {pdf doc} doc
     * @param {Input data} data
     * @param {Logged in user data} user
     * @returns doc
     */
    create: async function (doc, data, user, type, reqData, adminData) {
    
        //var for get start_date and end_date
        const { pdf_date_format } = adminData?.dataValues;
        let startDate = "";
        let endDate = "";
        if (reqData["filter"] && reqData["filter"]["filters"] && reqData["filter"]["filters"].length > 0) {
            for (let val of reqData["filter"]["filters"]) {
                if (val["field"] == 'date_start' && val["value"] != '') {
                    startDate = setFormatedDate(val["value"], pdf_date_format);
                } 
                else if (val["field"] == 'date_end' && val["value"] != '') {
                    endDate = setFormatedDate(val["value"], pdf_date_format);
                }

            }
        }
        //var for printed by name
        const printed_by_name = user?.loginUserName || "";

        //var for dynamic footer
        let business_get = await handy.getDefaultBusinessDetails(user?.company_id);
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";

        //Register font
        doc.registerFont("Roboto", "assets/fonts/Roboto/Roboto-Regular.ttf");
        doc.registerFont("Roboto-bold", "assets/fonts/Roboto/Roboto-Bold.ttf");
        doc.registerFont("Roboto-italic", "assets/fonts/Roboto/Roboto-Italic.ttf");
        doc.registerFont("Roboto-black", "assets/fonts/Roboto/Roboto-Black.ttf");
        doc.registerFont('Roboto-bolditalic', "assets/fonts/Roboto/Roboto-BoldItalic.ttf");

        //Title heading
        doc.fontSize(15);
        doc.font('Roboto-bold').opacity(0.5).text((`Sub Rental Report`), 10, 10).stroke();
        doc.font("Roboto").fontSize(11).opacity(0.8);

        // Right side data
        doc.text(`Report Range: ${(startDate || endDate) ? startDate + " - " + endDate : ` `}`, 0, 10, { width: doc.width, align: "right" });
        doc.text(`Printed by: ${printed_by_name ? printed_by_name : ` `}`, 0, doc.y + 2, { width: doc.width, align: "right" });

        doc.text("", 5, 52);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "ID#", property: 'id', align: 'left', width: 55, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "Date", property: 'date', align: 'left', width: 75, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "Del Date", property: 'del_date', align: 'left', width: 75, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "Qty", property: 'qty', align: 'center', width: 40, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "Item", property: 'item', align: 'left', width: 180, headerColor: "#ffffff", color: "#000000", headerOpacity: 1, padding: 2, renderer: null },
                { label: "Client", property: 'client', align: 'left', width: 155, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "Supplier", property: 'supplier', align: 'left', width: 127, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
                { label: "PO Sent Date", property: 'sent_date', align: 'left', width: 124, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 2, renderer: null },
            ],
        }
        table.datas = [];
        let body_data = data || [];
        for (let key in body_data) {
            const item = {
                id: body_data[key]?.rentalId || 0,
                date: body_data[key]?.date || "",
                del_date: body_data[key]?.del_date || "",
                qty: body_data[key]?.qty || 0,
                item: body_data[key]?.item || "",
                client: body_data[key]?.client_name || "",
                supplier: body_data[key]?.supplier_name || "",
                sent_date: body_data[key]?.sent_date || "",

            }
            table.datas.push(item);
        }

        const options = {
            x: 0, // {Number} default: undefined | doc.x
            y: 0, // {Number} default: undefined | doc.y
            divider: {
                header: { disabled: false, width: 0.7, opacity: 1 },
                horizontal: { disabled: false, width: 0.7, opacity: 1 },
            },
            prepareHeader: () => doc.font("Roboto").fontSize(11).opacity(0.4),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("Roboto").fontSize(11).opacity(0.65);
            },
        }

        await doc.table(table, options);

        //this is footer for this page
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            if (business_get) {
                doc.underline(0, doc.page.height - 32, doc.page.width, 0.5, { color: 'black' });
                doc.font('Roboto').fontSize(9).opacity(1).fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
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
        let name = "Rental Report - {{company}}.pdf";
        name = name.replace("{{company}}", "");
        return { file_name: name };
    },
};
