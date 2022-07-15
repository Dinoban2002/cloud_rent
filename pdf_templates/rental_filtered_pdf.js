const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { setFormatedDate } = require("../config/common");
let handy = require("../config/common");

module.exports = {
    /**
     * @author Kirankumar
     * @summary this function is used for place pdf with filters for rental
     * @param {pdf doc} doc 
     * @param {Input data} data 
     * @param {Logged in user data} user 
     * @returns doc
     */
    create: async function (doc, data, user, type, reqData, adminData) {
        let ti = 0, tp = 0;
        const page_width = doc.page.width - 21.89;
        const printed_by_name = user.loginUserName;
        const { pdf_date_format } = adminData.dataValues;

        let startDate = "";
        let endDate = "";
        if (reqData["filter"] && reqData["filter"]["filters"] && reqData["filter"]["filters"].length > 0) {
            for (let val of reqData["filter"]["filters"]) {
                if (val["field"] == 'date_start' && val["value"] != '') {
                    startDate = setFormatedDate(val["value"], pdf_date_format);
                } else if (val["field"] == 'date_end' && val["value"] != '') {
                    endDate = setFormatedDate(val["value"], pdf_date_format);
                }

            }
        }

        //var for dynamic footer
        let business_get = await handy.getDefaultBusinessDetails(user?.company_id);
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";

        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');
        doc.registerFont('Roboto-bolditalic', "assets/fonts/Roboto/Roboto-BoldItalic.ttf");

        //Title heading
        doc.fontSize(16);
        doc.font('Roboto-bold').text(("Booking Item Report"), 15, 15).stroke();
        doc.font("Roboto").fontSize(12);
        // Right side data

        doc.fontSize(10).text(`Report Range: ${(startDate || endDate) ? startDate + " - " + endDate : ` `}`, 0, 15, { width: doc.width, align: "right" });
        doc.fontSize(10).text(`Printed by: ${printed_by_name ? printed_by_name : ` `}`, 0, 30, { width: doc.width, align: "right" });
        doc.fontSize(12);


        doc.text("", 1, 60);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "ID#", property: 'id', align: 'left', width: 60, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Date", property: 'date', align: 'left', width: 120, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Client", property: 'client', align: 'left', width: 150, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Phone", property: 'phone', align: 'left', width: 80, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Delivery Address", property: 'deliveryAddress', align: 'left', width: 200, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Bin No", property: 'binNo', align: 'left', width: 85, headerColor: "#ffffff", color: "#000000", headerOpacity: "1", padding: 10, renderer: null },
                { label: "Location", property: 'location', align: 'left', width: 90, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                { label: "Qty", property: 'qty', align: 'right', width: 60, headerColor: "#ffffff", headerOpacity: "1", color: "#000000", padding: 10, renderer: null }
            ],
        }
        table.datas = [];

        if (data && data.length > 0) {
            for (let i in data) {

                let itemMain = {
                    id: { label: data[i].itemName + " | " + data[i].sku, options: { fontFamily: 'Roboto-bold', fontSize: 10 }, type: "item_sku" },
                    customization: {
                        customClass: "tableRowSubHeader",
                        customAlign: "left"
                    }
                }
                table.datas.push(itemMain);
                let body_data = data[i].tableDt
                let totalQty = 0;
                for (let key in body_data) {
                    totalQty = totalQty + body_data[key].qty;
                    let item = {
                        id: body_data[key].rentalId || "",
                        date: (body_data[key].rentalDate && body_data[key].rentalDeliveryDate) ? body_data[key].rentalDate + " - " + body_data[key].rentalDeliveryDate : "",
                        client: body_data[key].supplier || "",
                        phone: body_data[key].rentalCompanyContactPhone || "",
                        deliveryAddress: body_data[key].rentalDeliveryAddress || "",
                        binNo: body_data[key].bin_no || "",
                        location: body_data[key].location || "",
                        qty: body_data[key].qty || 0,
                    }

                    if ((key % 2)) {
                        item.options = {
                            columnColor: "#f2f2f2",
                            columnOpacity: 1,
                        }
                    }
                    table.datas.push(item);
                }

                // For total row
                let totalRowData = {
                    id: {
                        label: "Total " + totalQty, options: { fontSize: 10, fontFamily: 'Roboto-bold' }
                    },
                    customization: {
                        customClass: "tableRowSubHeader",
                        customAlign: "right"
                    }
                }
                table.datas.push(totalRowData);

                // To insert blank row
                // let blankRow = {
                //     id: { 
                //         label: "" 
                //     },
                //     customization : {
                //         customClass : "tableRowSubHeader",
                //         customAlign : "left"
                //     }
                // }
                // table.datas.push(blankRow);
            }
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

        //this is footer for this page
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            if (business_get) {
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
    }
}
