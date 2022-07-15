const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { numberWithCommas, setFormatedDate } = require("../config/common");
const moment = require('moment');
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

        //var 
        const { pdf_date_format, currency } = data.admin.dataValues;
        const printDate = setFormatedDate(new Date(), pdf_date_format);

        //var for dynamic footer
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
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
        doc.fontSize(14);
        doc.font('Roboto-bold').text((`Task List - Print Date ${printDate}`), 10, 10).stroke();
        doc.font("Roboto").fontSize(12);

        //this is cloudrent logo
        doc.image("assets/crlogo.png", 495, 2, { width: 95, height: 65 });

        doc.text("", 1, 68);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: [
                { label: "ID", property: 'id', align: 'left', width: 60, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 10, renderer: null },
                { label: "Date start", property: 'date_start', align: 'left', width: 75, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 10, renderer: null },
                { label: "Date End", property: 'date_end', align: 'left', width: 75, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 10, renderer: null },
                { label: "Type", property: 'type', align: 'left', width: 100, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 10, renderer: null },
                { label: "Status", property: 'status', align: 'left', width: 80, headerColor: "#ffffff", headerOpacity: 1, color: "#000000", padding: 10, renderer: null },
                { label: "Item", property: 'item', align: 'left', width: 190, headerColor: "#ffffff", color: "#000000", headerOpacity: 1, padding: 10, renderer: null },
            ],
        }
        table.datas = [];

        // if (data && data.length > 0) {
        let body_data = data.taskDetials || [];
        let resource_arr = [];
        for (let key in body_data) {
            resource_arr.push(body_data[key].resource);
        }
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        let reso_array = resource_arr.sort().filter(onlyUnique);  // store sorted and  unique value of cateogry 
        for (let i in reso_array) {
            let resourceName = {
                id: { label: reso_array[i], options: { fontFamily: 'Roboto-bolditalic', fontSize: 10 }, type: "item_sku" },
                customization: {
                    customClass: "tableRowSubHeader",
                    customAlign: "left"
                }
            }
            table.datas.push(resourceName);
            let line = {
                id: { label: "line", type: "line" },
                customization: {
                    customClass: "tableRowSubHeader",
                },
                date_start:{ label: "", type: "line" },
                date_end:{ label: "", type: "line" },
                type:{ label: "", type: "line" },
                status:{ label: "", type: "line" },
                item:{ label: "", type: "line" },
            }
            table.datas.push(line);
            for (let key in body_data) {
                if (body_data[key].resource == reso_array[i]) {
                    let item = {
                        id: body_data[key].task_id || "",
                        date_start:body_data[key].date_start? moment(body_data[key].date_start, "YYYY-MM-D").format("D/MM/YYYY"):"",
                        date_end:body_data[key].date_end? moment(body_data[key].date_end, "YYYY-MM-D").format("D/MM/YYYY"):"",
                        type: body_data[key].summary || "",
                        status: body_data[key].status || "",
                        item: body_data[key].item_name || "",
                    }
                    table.datas.push(item);
                    if(body_data[key].description){
                        let desc ={
                            id: { label: body_data[key].description|| "", options: { fontFamily: 'Roboto', fontSize: 10 }, type: "item_sku" },
                            customization: {
                                customClass: "tableRowSubHeader",
                                customAlign: "left"
                            }
                        }
                        table.datas.push(desc);
                    }
                }

            }
        }
        const options = {
            x: 0, // {Number} default: undefined | doc.x
            y: 0, // {Number} default: undefined | doc.y
            divider: {
                header: { disabled: true, width: 2, opacity: 0.2 },
                horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 }
            },
            prepareHeader: () => doc.font("Roboto").fontSize(11).opacity(0.5),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("Roboto").fontSize(9.5).opacity(0.8);
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
            if (data?.business_get) {
                doc.font('Roboto').opacity(1).fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
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
        let name = "Rental Report - {{company}}.pdf";
        name = name.replace("{{company}}", "");
        return { file_name: name };
    },
};
