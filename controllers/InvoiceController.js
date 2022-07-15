const { RentalItems, Administration, InvoiceItems, Invoice, Rental, Terms, Rate, OffHire, TaxRate } = require("../models/Model")(
  ["RentalItems", "Administration", "InvoiceItems", "Invoice", "Rental", "Terms", "Rate", "OffHire", "TaxRate"]
);;
const handy = require("../config/common");
const { lang } = handy
const Op = require('sequelize').Sequelize.Op;
let moment = require('moment');
var translate = require('../language/translate').validationMsg;
const invoice = {
  /**
   * @author Kirankumar
   * @summary This function is used for get invoices for client and rental.
   * @param {Request body} body 
   * @param {Logged in user details} user 
   * @return List of invoices
   */
  get_rental_and_client_invoices: async function (body, user) {
    const attributes = ["__invoice_id_pk", "_rental_id_fk", "_client_id_fk", "disp_amount_paid", "disp_balance", "due_date", "invoice_id_no", "summary", "status", "total", "type"];
    let data = [];
    if (body && body.rental_id) {
      data = await Invoice.findAll({ attributes, where: { _rental_id_fk: body.rental_id } })
    } else if (body && body.client_id) {
      data = await Invoice.findAll({ attributes, where: { _rental_id_fk: body.client_id } })
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) }
    }
    if (data.length) {
      data = await handy.transformnames("LTR", data, Invoice, "Invoice")
    }
    return { status: true, data }
  },
  /**
   * @author Kirankumar
   * @summary This function is used for create blank, booking and longterm hire invoices
   * @param {Request data} data 
   * @param {Logged in user details} user 
   * @returns created invoice data
   */
  createInvoice: async function (data, user) {
    let inv_type = "";
    const rental_update_data = {};
    const invoice_data = {};
    let invoice_date = "";
    let summary = "";
    let { rental_id, action_type, action_method, rental_already_invoiced_no } = data;
    if (!rental_id) {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
    //get rental data
    const rental = await Rental.findOne({ raw: true, where: { '__rental_id_pk': rental_id } });
    if (!rental) {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }

    let invoice_serial_no = await Invoice.max("invoice_serial_no", { where: { _rental_id_fk: rental_id } }) || 0;
    //----------------------
    //test define values
    //action_type = "blank";
    if (!action_type) {
      action_type = "blank"
    }
    //-------------------------
    const admin = await Administration.findOne({ where: { _company_id_fk: user.company_id } });
    const { use_surcharge_always, use_pro_rata, surcharge_rate, use_surcharge: admin_use_surcharge, surcharge_code, surcharge_label, surcharge_sku, default_sales_code, use_meterage } = admin;
    let { off_hire_partial_return_percentage, job_name: ref, unstored_period_propata_days, unstored_period_prorata, delivery_charge, collection_charge, sur_charge, use_surcharge, billing_period_no, date_start, date, date_end, period_no, check_box_billing_set, __rental_id_pk, _client_id_fk, _tax_rate_id_fk, _config_term_id_fk, _credit_card_rate_id_fk, discount_cash, selected_company_no, off_hire_date, prorata_billing, unstored_count_invoices: extension, off_hire_number, long_term_hire: long_term, billing_date_start, bond, sur_charge: surcharge, billing_date_end: billing_date_end_copy, billing_date_next } = rental;
    let id_invoice = __rental_id_pk.toString().padStart(6, '0');
    let temp_surcharge = 0;
    let id_Invoice = "";
    let billing_date_end = "";
    //let billing_date_next = "";
    let pro_rata_key = "";
    let days = 0;
    //need to set values based on param
    let pro_rata_percent = ""; //proRata%
    let pro_rata = "";        //proRate
    let proRataDays = ""; //$proRataDays
    let initial = "";
    if (action_type == "blank") {
      param = "new";
      inv_type = "new";
      summary = "Rental Period: " + moment(date).format(user.inv_date_format) + " - " + moment(date_end).format(user.inv_date_format);
      //ParamPrepare ( "CURRENT_CUSTOMER_ID" ;  Clients::id ) &
      // ParamPrepare ( "dateStart" ;  Interface::Date) &
      // ParamPrepare ( "invType" ;  "New") &
      // ParamPrepare ( "dateEnd" ;  Interface::DateEnd ) &
      // ParamPrepare ( "days" ;  GetAsNumber ( Interface::Billing Date End - Interface::Billing Date Start) ) &
      // ParamPrepare ( "billingDateStart" ;  Interface::Billing Date Start) &
      // ParamPrepare ( "billingDateEnd" ;  Interface::Billing Date End ) &
      // ParamPrepare ( "billingDateNext" ;  Interface::Billing Date Next ) &
      // ParamPrepare ( "summary" ;  "Rental Period: "  & Interface::Date  & " - " & Interface::DateEnd ) &
      // ParamPrepare ( "id_rental" ;Interface::id ) &
      // ParamPrepare ( "id_invoice" ; Interface::Invoice ID ) &
      // ParamPrepare ( "repNo" ; Interface::SelectedCompanyNo ) &
      // ParamPrepare ( "id_customer" ; Interface::id_Customer ) &
      // ParamPrepare ( "id_main" ; Interface::ID 2 ) &
      // ParamPrepare ( "mtrCharge" ; Interface::Meterage Charge) &

      // ParamPrepare ( "ref" ; Interface::Job Name ) &

      // ParamPrepare ( "taxRate" ;  Interface::Tax Rate) &
      // ParamPrepare ( "taxRate2" ;  Interface::Tax Rate_2) &
      // ParamPrepare ( "taxRateLabel" ;  Interface::Tax Rate Label) &
      // ParamPrepare ( "taxRate2Label" ;  Interface::Tax Rate Label_2) &
      // ParamPrepare ( "rate" ;  Interface::Rate) &
      // ParamPrepare ( "terms" ;  Interface::Terms) &

      // ParamPrepare ( "bond" ; Interface::Bond ) &
      // ParamPrepare ( "delivery" ; Interface::DeliveryCharge) &
      // ParamPrepare ( "collection" ;  Interface::CollectionCharge ) &
      // ParamPrepare ( "surcharge" ;  Interface::Surcharge ) &
      // ParamPrepare ( "period" ;  Interface::PeriodNo ) &
      // //ParamPrepare ( "longTerm" ;  Interface::Long Term Hire ) &
      // ParamPrepare ( "extension" ; Interface::unstored_countInvoices ) &

      // ParamPrepare ( "billingPeriodNo" ; Interface::Billing Period Number ) &
      // ParamPrepare ( "termNo" ; Interface::TermsAsNumber )
    } else if (action_type == "offhire") {
      param = "offhire"
      const summary_date = new Date(billing_date_start) != "Invalid Date" ? moment(billing_date_start).format(user.inv_date_format) : "";
      summary = "OFF HIRE PERIOD: " + summary_date + " - " + moment(off_hire_date).format(user.inv_date_format);
      billing_date_end = billing_date_end_copy;
      //ParamPrepare("param" ; "Offhire") &
      // ParamPrepare ( "CURRENT_CUSTOMER_ID" ;  Clients::id ) &
      // ParamPrepare ( "dateStart" ;  Interface::Date) &
      // ParamPrepare ( "dateEnd" ;  Interface::DateEnd ) &
      // ParamPrepare ( "days" ;  Interface::offhire_NumberDaysPartialReturn ) &
      // ParamPrepare ( "billingDateNext" ;  Interface::Billing Date Next ) &
      // ParamPrepare ( "id_rental" ;Interface::id ) &
      // ParamPrepare ( "id_invoice" ; Interface::Invoice ID ) &
      // ParamPrepare ( "repNo" ; Interface::SelectedCompanyNo ) &
      // ParamPrepare ( "id_customer" ; Interface::id_Customer ) &
      // ParamPrepare ( "id_main" ; Interface::ID 2 ) &
      // ParamPrepare ( "mtrCharge" ; Interface::Meterage Charge) &
      // ParamPrepare ( "taxRate" ;  Interface::Tax Rate) &
      // ParamPrepare ( "taxRate2" ;  Interface::Tax Rate_2) &
      // ParamPrepare ( "taxRateLabel" ;  Interface::Tax Rate Label) &
      // ParamPrepare ( "taxRate2Label" ;  Interface::Tax Rate Label_2) &
      // ParamPrepare ( "rate" ;  Interface::Rate) &
      // ParamPrepare ( "terms" ;  Interface::Terms) &
      // ParamPrepare ( "ccardRate" ; Interface::Credit Card Rate) &
      // ParamPrepare ( "ccardRateLabel" ; Interface::Credit Card Label) &
      // ParamPrepare ( "ref" ; Interface::Job Name ) &
      // ParamPrepare ( "bond" ; Interface::Bond ) &
      // ParamPrepare ( "delivery" ; Interface::DeliveryCharge) &
      // ParamPrepare ( "collection" ;  Interface::CollectionCharge ) &
      // ParamPrepare ( "surcharge" ;  Interface::Surcharge ) &
      // ParamPrepare ( "period" ;  Interface::PeriodNo ) &
      // ParamPrepare ( "longTerm" ;  Interface::Long Term Hire ) &
      // ParamPrepare ( "extension" ; Interface::unstored_countInvoices ) &

      // ParamPrepare ( "billingPeriodNo" ; Interface::Billing Period Number ) &
      // ParamPrepare ( "termNo" ; Interface::TermsAsNumber )
    } else {
      param = "booking"
      summary = "Rental Period: " + moment(date).format(user.inv_date_format) + " - " + moment(date_end).format(user.inv_date_format);
      billing_date_end = billing_date_end_copy;
      initial = check_box_billing_set;
      // ParamPrepare ( "CURRENT_CUSTOMER_ID" ;  Clients::id ) &
      // ParamPrepare ( "dateStart" ;  Interface::Date) &
      // ParamPrepare ( "dateEnd" ;  Interface::DateEnd ) &
      // ParamPrepare ( "days" ;  GetAsNumber ( Interface::Billing Date End - Interface::Billing Date Start  ) + 1 ) &
      // ParamPrepare ( "site" ;  Interface::Site Name ) &
      // ParamPrepare ( "initial" ;  Interface::CheckBox_BillingSet) &
      // ParamPrepare ( "billingDateNext" ;  Interface::Billing Date Next ) &
      // ParamPrepare ( "id_rental" ;Interface::id ) &
      // ParamPrepare ( "id_invoice" ; Interface::Invoice ID ) &
      // ParamPrepare ( "repNo" ; Interface::SelectedCompanyNo ) &
      // ParamPrepare ( "ref" ; Interface::Job Name ) &
      // ParamPrepare ( "id_customer" ; Interface::id_Customer ) &
      // ParamPrepare ( "id_main" ; Interface::ID 2 ) &
      // ParamPrepare ( "mtrCharge" ; Interface::Meterage Charge) &
      // ParamPrepare ( "cashDiscount" ; Interface::Discount Cash) &
      // ParamPrepare ( "taxRate" ;  Interface::Tax Rate) &
      // ParamPrepare ( "taxRate2" ;  Interface::Tax Rate_2) &
      // ParamPrepare ( "taxRateLabel" ;  Interface::Tax Rate Label) &
      // ParamPrepare ( "taxRate2Label" ;  Interface::Tax Rate Label_2) &
      // ParamPrepare ( "rate" ;  Interface::Rate) &
      // ParamPrepare ( "terms" ;  Interface::Terms) &
      // ParamPrepare ( "ccardRate" ; Interface::Credit Card Rate) &
      // ParamPrepare ( "ccardRateLabel" ; Interface::Credit Card Label) &
      // ParamPrepare ( "bond" ; Interface::Bond ) &
      // ParamPrepare ( "delivery" ; Interface::DeliveryCharge) &
      // ParamPrepare ( "collection" ;  Interface::CollectionCharge ) &
      // ParamPrepare ( "surcharge" ;  Interface::Surcharge ) &
      // ParamPrepare ( "period" ;  Interface::PeriodNo ) &
      // ParamPrepare ( "longTerm" ;  Interface::Long Term Hire ) &
      // ParamPrepare ( "extension" ; Interface::unstored_countInvoices ) &
      //
      // ParamPrepare ( "billingPeriodNo" ; Interface::Billing Period Number ) &
      // ParamPrepare ( "billingPeriodAmt" ;Interface::Billing Period Amount ) &
      // ParamPrepare ( "termNo" ; Interface::TermsAsNumber )
    }

    //check need to set values
    proRataDays = unstored_period_propata_days;
    pro_rata = prorata_billing;

    if (param == "offhire") {
      // ParamPrepare ( "ProRata%" ; Interface::offhire_PartialReturnPercentage ) &
      pro_rata_percent = off_hire_partial_return_percentage;
    } else {
      //ParamPrepare ( "ProRata%" ; Interface::unstored_Period_ProRata )
      pro_rata_percent = unstored_period_prorata;
    }


    //check1
    //businessType= Company Administration::BusinessType;
    // if(businessType == "VEHICLE"){
    //   //alert "Is this invoice for the insurence company or client?"
    // }
    //check2 about account code
    //repNo = Interface::SelectedCompanyNo
    /*if(repNo ==1 ){
  
    }else if(repNo == 2){
  
    }else if(repNo == 3){
  
    }
     */
    const rental_items = await RentalItems.findAll({ where: { _rental_id_fk: rental_id, balance: { [Op.gt]: 0 } } });
    if (rental_items.length < 1 && param != "new" && param != "offhire") {
      return { status: true, alert: lang('Validation.invoice_item_not_found', user.lang) };
    }
    if (param == "offhire" && !off_hire_number) {
      return { status: true, alert: lang('Validation.rental_off_hire_full_alert', user.lang) };
    }
    if (long_term == 1 && (new Date(billing_date_start) == "Invalid Date" || !billing_date_start)) {
      return { status: true, alert: lang('Validation.rental_off_hire_full_billing_date_alert', user.lang) };
    }
    //process dailog from FM here no need.
    //check for invoice already exist or not
    //rental_already_invoiced_no functionality need to create//invType == new
    let invoice_count = 0;
    if (long_term != 1) {
      invoice_count = await Invoice.count({ where: { _rental_id_fk: rental_id } });
      if (invoice_count > 0 && !rental_already_invoiced_no && inv_type != "new") {
        return { status: true, confirmation: lang('Validation.rental_already_invoiced', user.lang) };
      } else if (rental_already_invoiced_no == 2) {
        inv_type = "new";
      }
    }
    //have to check invoice::type != "POS"
    if (extension > 0) {
      delivery_charge = 0;
      collection_charge = 0;
      bond = "";
      //collection = "";
      //delivery = "";
      if (use_surcharge_always != 1)
        surcharge = "";

      if (param != "offhire") {
        pro_rata_percent = "";
        // if (pro_rata)
        //   pro_rata_percent = "";
      }
    }
    //LONG TERM RENTAL INVOICE
    if (long_term == 1) {
      if ((use_pro_rata == 1 && extension == 0) || (use_pro_rata == 2 && extension == 1)) {
        await Rental.update({ prorata_billing: 1 }, { where: { __rental_id_pk: rental_id, is_deleted: 0 } });
        const billing_Dates = await handy.update_rental_billing_dates(rental_id, user);
        billing_date_end = billing_Dates.billing_date_end;// || new Date(billing_date_end_copy);
        billing_date_next = billing_Dates.billing_date_next;//new Date(new Date(billing_date_end_copy).setDate(billing_date_end.getDate() + 1));
        days = (Math.abs(billing_date_end - new Date(billing_date_start)) / (1000 * 3600 * 24)) + 1;
        pro_rata_key = 1;
        await Rental.update({ prorata_billing: 0 }, { where: { __rental_id_pk: rental_id, is_deleted: 0 } });
      }

      //if rental has invoices
      if (extension > 0) {

        if (param == "longterm") {
          //check need to confirm the functionality longterm
        }
        //id_invoice = id_invoice + "." + extension;
        if ((extension || 0) <= invoice_serial_no) {
          id_invoice = id_invoice + "." + ++invoice_serial_no;
        } else {
          id_invoice = id_invoice + "." + extension;
          invoice_serial_no = extension;
        }

        if (param != "offhire") {
          summary = "Period: " + moment(billing_date_start).format(user.inv_date_format) + " - " + moment(billing_date_end).format(user.inv_date_format);
        }

        if (param == "longterm") {
          //check need to confirm the functionality with longterm
        } else if (param == "offhire") {

        } else {
          rental_update_data.billing_date_prev = billing_date_start;
          rental_update_data.billing_date_start = billing_date_next;
          rental_update_data.invoiced_on = new Date();
          rental_update_data.invoiced_by = user.user_id;
        }
      } else {
        if (prorata_billing == 1) {
          summary = "PRO RATA PERIOD - " & $proRataDays + " days: " + moment(billing_date_start).format(user.inv_date_format) + " - " + moment(billing_date_end).format(user.inv_date_format)
        } else {
          summary = "Period: " + moment(billing_date_start).format(user.inv_date_format) + " - " + moment(billing_date_end).format(user.inv_date_format);
        }
        if (param == "longterm") {
          //check need to confirm the functionality longterm
        } else if (param == "offhire") {
          rental_update_data.billing_date_end = off_hire_date;
        } else {
          rental_update_data.billing_date_prev = billing_date_start;
          rental_update_data.billing_date_start = billing_date_next;
          rental_update_data.invoiced_on = new Date();
          rental_update_data.invoiced_by = user.user_id;
        }
      }
    }

    if (invoice_date == "") {
      invoice_date = new Date();
    }
    //offhire invoice
    if (param == "offhire") {
      const summary_date = new Date(billing_date_start) != "Invalid Date" ? moment(billing_date_start).format(user.inv_date_format) : "";
      summary = "OFF RENTAL INVOICE: " + summary_date + " - " + moment(off_hire_date).format(user.inv_date_format)
      rental_update_data.invoiced_on = new Date();
      rental_update_data.invoiced_by = user.user_id;
    }
    // else if(get(scriptparameeter == "Damage")){
    // have to checkfunctionality
    // }
    //normal invoice
    if (long_term != 1) {
      rental_update_data.invoiced_on = new Date();
      rental_update_data.invoiced_by = user.user_id;
    }
    let due_date = new Date();
    const term = _config_term_id_fk ? await Terms.findOne({ where: { '__config_term_id_pk': _config_term_id_fk } }) : "";
    const term_name = term ? term.get("term_label") : "0";
    const period_num = term_name.slice(-2);
    const type = term_name ? term_name.split(" ")[0] : term_name;
    let rental_date = new Date(date);
    const rental_date_month_end = await handy.get_last_date_of_month(rental_date);
    const eom = (rental_date_month_end).getDate() - rental_date.getDate();
    if (date && type.toLowerCase() == "eom") {
      due_date = new Date(rental_date.setDate(rental_date.getDate() + eom + parseInt(period_num)));
    } else if (type.toLowerCase() == "due") {
      due_date = date;
    } else if (period_num > 0) {
      //rental.get("date") + Number.isInteger(parseInt(term_name)) &&
      if (date)
        due_date = new Date(rental_date.setDate(rental_date.getDate() + parseInt(period_num)));
    }
    //default values for all invoices.
    invoice_data.type = "INVOICE";
    invoice_data.date = invoice_date;
    const items = await RentalItems.findAll({ where: { _rental_id_fk: rental_id } });
    if (!items.length && param != "new") {
      return { status: true, alert: lang('Validation.invoice_item_not_found', user.lang) };

    } else if (inv_type == "new") {
      //Create an invoice with no line items.
      summary = "";
      invoice_data._client_id_fk = _client_id_fk;
      invoice_data._rental_id_fk = __rental_id_pk;
      if (param == "new") {
        invoice_data.invoice_type = 1;
      }
      invoice_data.selected_company_no = selected_company_no;
      invoice_data._tax_rate_id_fk = _tax_rate_id_fk;
      invoice_data.discount_cash = discount_cash;
      invoice_data._credit_card_rate_id_fk = _credit_card_rate_id_fk;
      if (extension) {
        if ((extension || 0) <= invoice_serial_no) {
          id_invoice = id_invoice + "." + invoice_serial_no + 1;
          invoice_data.invoice_serial_no = invoice_serial_no;
        } else {
          id_invoice = id_invoice + "." + extension;
          invoice_data.invoice_serial_no = extension;
        }
      }
      invoice_data.invoice_id_no = id_invoice;
      invoice_data.summary = summary;
      invoice_data.terms = _config_term_id_fk;
      invoice_data.due_date = due_date;
      invoice_data.meterage_charge = use_meterage || 0;
      const invoice = await Invoice.create(invoice_data);
      let invoice_id = 0;
      if (invoice && invoice.__invoice_id_pk) {
        invoice_id = invoice.__invoice_id_pk;
      } else {
        return { status: false, message: lang('Validation.invoice_not_create', user.lang) };
      }
      await handy.update_rental_billing_dates(rental_id, user);
      return await handy.getInvoice(0, invoice_id, 0, user, true);
      //return { status: true, data: [invoice] };
    } else {
      //Create an invoice with line items.
      invoice_data._client_id_fk = _client_id_fk;
      invoice_data._rental_id_fk = __rental_id_pk;
      invoice_data.date = invoice_date;
      invoice_data.selected_company_no = selected_company_no;
      invoice_data.reference_xero = ref;
      invoice_data._tax_rate_id_fk = _tax_rate_id_fk;
      invoice_data.discount_cash = discount_cash;
      invoice_data._credit_card_rate_id_fk = _credit_card_rate_id_fk;
      invoice_data.invoice_id_no = id_invoice;
      invoice_data.summary = summary;
      invoice_data.invoice_serial_no = invoice_serial_no;
      //let due_date = new Date();
      invoice_data.terms = _config_term_id_fk;
      invoice_data.due_date = due_date;
      //have to check
      if (invoice_count < 1) {

      } else {

      }
      //if long term rental then set billing dates
      if (long_term == 1) {
        invoice_data.date_start = billing_date_start;
        invoice_data.date_end = billing_date_end;
      } else {
        invoice_data.date_start = date_start;
        invoice_data.date_end = date_end;
      }
    }
    invoice_data.meterage_charge = use_meterage || 0;
    const invoice = await Invoice.create(invoice_data);
    let invoice_id = 0;
    let invoice_items = [];
    if (invoice && invoice.__invoice_id_pk) {
      invoice_id = invoice.__invoice_id_pk;
    } else {
      return { status: false, message: lang('Validation.invoice_not_create', user.lang) };
    }

    for (rental_item of rental_items) {
      let { _inventory_id_fk, discount_rate, account_code, units, taxable, type: item_type, status, balance = 0, is_re_occur, sku, item, unit_price, balance_metres, sort } = rental_item;
      let invoice_item = {};
      let qty = 0;
      //IF LONG TERM ADD BALANCE TO QUANTITY INSTEAD OF QUANTITY AS THE AMOUNT COULD HAVE CHANGED
      let key = 0;
      if (long_term != 1) {
        qty = rental_item.qty;
      } else {
        if (balance_metres) {
          rental_update_data.meterage_charge = "yes";
        }
        if ((balance == 0 && status == "PENDING") || status == "IN") {
          qty = rental_item.qty;
        } else {
          qty = balance;
        }
        //SET KEY SO WE CAN BYPASS SERVICES AND SALE ITEMS FOR SECOND INVOICES
        key = ((item_type == "SELL" || item_type == "SERVICE") && extension > 0 && is_re_occur != 1) ? 1 : 0;
      }

      if (key != 1 && qty != 0) {
        if (balance == 0 && status == "IN") {
          invoice_item.sku = sku;
          invoice_item.qty = qty;
          if (taxable)
            invoice_item.taxable = taxable;
          invoice_item.item = item;
          invoice_item.unit_price = unit_price;
        } else if (balance == 0 && status != "PENDING") {
        } else {
          invoice_item.sku = sku;
          invoice_item.qty = qty;
          if (taxable)
            invoice_item.taxable = taxable;
          invoice_item.item = item;
          invoice_item.unit_price = unit_price;
        }
        invoice_item.type = item_type;
        invoice_item.sort_index = sort;
        invoice_item._inventory_id_fk = _inventory_id_fk;
        invoice_item.discount_rate = discount_rate ? parseFloat(discount_rate) : 0;
        invoice_item._invoice_id_fk = invoice_id;
        //INVOICE.RUN need to check
        let days = 0;
        if (rental.billing_due_date != '0000-00-00' && rental.billing_date_start != '0000-00-00') {
          days = (Math.abs(new Date(rental.billing_date_end) - new Date(rental.billing_date_start)) / (1000 * 3600 * 24)) + 1;
        }
        const rate_config = await Rate.findOne({ where: { '__rate_config_id_pk': rental._rate_config_id_fk } }) || {};
        const { is_daily, is_weekly, label = '' } = rate_config;
        if (long_term == 1 && item_type != "SERVICE") {
          if (initial == 1 && extension < 1) {
            invoice_item.units = period_no;
          } else if (prorata_billing) {
            invoice_item.units = prorata_billing;
          } else if (rate_config && label.match(/daily/i)) {
            invoice_item.units = billing_period_no;
          } else if (rate_config && (is_weekly || label.match(/weekly/i))) {
            invoice_item.units = days ? Math.round((days / 7) * 100) / 100 : 0;
          } else {
            invoice_item.units = 1;
          }
        } else {
          invoice_item.units = units;
        }

        if (balance_metres) {
          rental_update_data.meterage_charge = "yes";
          invoice_item.metres = balance_metres;
        }
        //CHECK IF THERE IS AN INVENTORY ACC CODE OR SET DEFAULT CODE FOR CURRENT COMPANY
        if (account_code) {
          invoice_item.account_code_xero = account_code;
        } else {
          invoice_item.account_code_xero = default_sales_code;
        }
      }
      key = 0;
      if (Object.keys(invoice_item).length) {
        invoice_item.amount = await this.set_amount(invoice_item, invoice_data.meterage_charge, user)
        if (invoice_item.type != "SERVICE") {
          temp_surcharge += invoice_item.amount;
        }
        invoice_items.push(invoice_item);
      }
    };
    if (Object.keys(rental_update_data).length) {
      await Rental.update(rental_update_data, { where: { __rental_id_pk } });
    }


    //If have delivery charge then add to invoice items
    if (delivery_charge && delivery_charge > 0) {
      let invoice_item = {
        _invoice_id_fk: invoice_id,
        sku: "DEL",
        qty: 1,
        item: "Delivery Charge",
        unit_price: delivery_charge,
        type: "SERVICE",
        account_code_xero: surcharge_code,
        units: 1
      }
      //Need to check $taxable
      //if (taxable) {
      invoice_item.taxable = 1;
      //}
      invoice_item.amount = await this.set_amount(invoice_item, invoice_data.meterage_charge, user)
      invoice_items.push(invoice_item);
    }
    //If have collection charge then add to invoice items
    if (collection_charge && collection_charge > 0) {
      let invoice_item = {
        _invoice_id_fk: invoice_id,
        sku: "COL",
        qty: 1,
        item: "Collection Charge",
        unit_price: collection_charge,
        type: "SERVICE",
        account_code_xero: surcharge_code,
        units: 1
      }
      //Need to check $taxable
      //if (taxable) {
      invoice_item.taxable = 1;
      //}
      invoice_item.amount = await this.set_amount(invoice_item, invoice_data.meterage_charge, user)
      invoice_items.push(invoice_item);
    }
    //If have sur charge then add to invoice items
    if (use_surcharge && sur_charge > 0) {
      if (use_surcharge_always) {
        let admin_surcharge_rate = admin_use_surcharge ? surcharge_rate : 0;
        sur_charge = temp_surcharge * admin_surcharge_rate;
      }
      let invoice_item = {
        _invoice_id_fk: invoice_id,
        sku: surcharge_sku,
        qty: 1,
        item: surcharge_label,
        unit_price: sur_charge,
        type: "SERVICE",
        taxable: 1,
        account_code_xero: surcharge_code,
        units: 1
      }
      invoice_item.amount = await this.set_amount(invoice_item, invoice_data.meterage_charge, user)
      invoice_items.push(invoice_item);
    }
    //If have partial returns
    const offhire_items = await OffHire.findAll({ where: { _rental_id_fk: rental_id, billed: 0, pro_rata_percent: { [Op.gt]: 0 } } })
    for (offhire_item of offhire_items) {
      let { __off_hire_id_pk, metre_charge, sku, qty_in: returnAmount, qty_in, price, panels, pro_rata_percent, is_stand_down, days, item_name, billing_date_start, return_date } = offhire_item;
      let invoice_item = {
        _invoice_id_fk: invoice_id,
        sku: sku,
        units: pro_rata_percent || 1,
        unit_price: price,
        type: "",
        taxable: 1,
      }
      let start = "";
      let end = "";
      start = (billing_date_start && new Date(billing_date_start) != "Invalid Date") ? moment(billing_date_start).format("DD/MM/yyyy") : "";
      end = (return_date && new Date(return_date) != "Invalid Date") ? moment(return_date).format("DD/MM/yyyy") : "";
      if (is_stand_down == 1) {
        //have to check

        invoice_item.item = item_name + " - Stand Down " + days + " day/s " + start + " - " + end;//GetValue( $split ; 2 ) & " - Stand Down "& $days & " day/s " &  $start & " - " & $end
        invoice_item.qty = qty_in;
      } else {
        if (metre_charge) {
          let summary = returnAmount + " METRES PARTIAL RETURN: " + start + " - " + end;// $returnAmount & " METRES PARTIAL RETURN: "  &  DateText ( $start ) & " - " & DateText ( $end )
          invoice_item.item = summary + " - " + days + "\r\n & days " + start + " - " + end;//$summary & " - "& $days //& " days " &  $start & " - " & $end
          invoice_item.qty = panels;
          invoice_item.metres = qty_in;
        } else {
          invoice_item.qty = qty_in;
          invoice_item.item = item_name + " - " + days + " days " + start + " - " + end; //GetValue( $split ; 2 ) & " - "& $days & " days " &  $start & " - " & $end
        }
      }
      await OffHire.update({ billed: 1 }, { where: { __off_hire_id_pk } });
      //item: surcharge_label,//need to set
      //qty: 1,
      //have to update invoicerun have to check
      invoice_items.push(invoice_item);
    }


    // invoice_items.map(value => {
    //   value._invoice_id_fk = invoice_id;
    //   return value;
    // })
    if (invoice_items.length) {
      invoice_items = await InvoiceItems.bulkCreate(invoice_items);
    }
    await handy.update_rental_billing_dates(rental_id, user);
    const responds = await handy.getInvoice(0, invoice_id, 0, user, true);
    return responds;
  },
  /**
   * @summary this function is used for calculate the invoice item amount
   * @param {Invoice item} item 
   * @param {metre charge = 0 || 1} metre_charge 
   * @param {Loggedin user detaila} user 
   * @returns amount;
   */
  set_amount: async function (item, metre_charge, user) {
    let amount = 0;
    const { unit_price: price, units, metres, qty } = item;
    let discount = await this.set_dicount_amount(item, user);
    if (metre_charge > 0) {
      if (metres > 0) {
        amount = units > 0 ? (price * metres * units) - discount : (price * metres) - discount;//>= check there in FM
      } else {
        amount = units <= 0 ? (price * qty) - discount : (price * qty * units) - discount;
      }
    } else {
      amount = units > 0; (price * qty * units) - discount;
      amount = units <= 0; (price * qty) - discount
    }
    return amount || 0;
  },
  /**
   * @author Kirankumar
   * @summary This function is used for calculate invoice item discount amount
   * @param {Invoice item} item 
   * @param {Logged in user details} user 
   * @returns discount amount
   */
  set_dicount_amount: async function (item, user) {
    const { units, unit_price, qty, discount_rate } = item;
    let dicount_amount = units > 0 ? (qty * unit_price * units) * discount_rate : (qty * unit_price) * discount_rate;
    return (Math.round(dicount_amount * 100) / 100) || 0;
  },
  /**
   * @author Kirankumar
   * @summary This function is used for get the invoice list for rental.
   * @param {Rental id} rental_id 
   * @param {Logged in user details} user 
   * @returns List of rental invoices
   */
  getInvoice: async function (rental_id, user) {
    if (rental_id) {
      const attributes = ["__invoice_id_pk", "_rental_id_fk", "_client_id_fk", "amount_paid", "due_date", "invoice_id_no", "summary", "status", "total", "type", "temp_applied", "balance"];
      let invoice_data = await Invoice.findAll({
        attributes, where: { _rental_id_fk: rental_id }
      });
      invoice_data = handy.transformnames('LTR', invoice_data, "Invoice", {}, user) || [];
      let rental_calculated_data = await handy.auto_update_or_calculate_rental(rental_id, false, user, false) || {};
      return { status: true, data: invoice_data, rental_calculated_data };
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  },
  /**
     * @author Kirankumar
     * @summary This function is used for create the damage invoice for rental
     * @param {Rental id} rental_id
     * @returns Status and Created data
     */
  createDamageInvoice: async function (data, user) {
    const { rental_id } = data;
    const invoice_data = [];
    if (!rental_id) {
      return { status: false, message: translate('Validation.invalid_data', user.lang) };
    }
    //get rental data
    const rental = await Rental.findOne({ where: { '__rental_id_pk': rental_id, is_deleted: 0 } });
    if (!rental) {
      return { status: false, message: translate('Validation.invalid_data', user.lang) };
    }
    let invoice_serial_no = await Invoice.max("invoice_serial_no", { where: { _rental_id_fk: rental_id } }) || 0;
    let damage_items = await RentalItems.findAll({
      where: {
        _rental_id_fk: rental_id, loss: {
          [Op.gte]: 1
        }
      }
    });
    const default_tax = await TaxRate.findOne({ attributes: ["__tax_rate_id_pk"], where: { is_default: 1, _company_id_fk: user.company_id } });

    if (!damage_items.length && !rental.damage) {
      return { status: true, alert: translate('Validation.damage_items_not_found', user.lang) }
    } else if (damage_items.length) {
      const invoice_update_data = {
        _rental_id_fk: rental_id,
        _client_id_fk: rental._client_id_fk,
        _tax_rate_id_fk: default_tax ? default_tax.__tax_rate_id_pk : 0,//rental._tax_rate_id_fk,
        date: new Date(),
        due_date: new Date(),
        type: "INVOICE",
        selected_company_no: rental.selected_company_no,
        summary: "INVOICE FOR INVENTORY LOSS",
        date_start: rental.date,
        date_end: rental.date_end
      };
      let invoice_count = "";
      if (rental.get("unstored_count_invoices") > 0) {
        if (rental.get("unstored_count_invoices") <= invoice_serial_no) {
          invoice_count = "." + ++invoice_serial_no;
          invoice_update_data.invoice_serial_no = invoice_serial_no;
        } else {
          invoice_count = "." + rental.get("unstored_count_invoices");
          invoice_update_data.invoice_serial_no = rental.get("unstored_count_invoices");
        }
      }
      //let invoice_count = rental.get("unstored_count_invoices") > 0 ? "." + rental.get("unstored_count_invoices") : "";
      invoice_update_data.invoice_id_no = rental.get("__rental_id_pk") + invoice_count;
      rental.unstored_count_invoices += 1;
      await Rental.update({ unstored_count_invoices: rental.get("unstored_count_invoices") }, { where: { '__rental_id_pk': rental_id } });
      let invoice = await Invoice.create(invoice_update_data);
      if (damage_items.length && invoice.__invoice_id_pk) {
        const invoice_items = [];
        for (item of damage_items) {
          const invoice_item = {
            _invoice_id_fk: invoice.__invoice_id_pk,
            sku: item.sku,
            item: item.item,
            qty: item.loss,
            unit_price: item.replacement_cost,
            taxable: item.taxable,
            type: item.type,
            units: 1
          }
          invoice_items.push(invoice_item);
        }
        damage_items = await InvoiceItems.bulkCreate(invoice_items);
        //await handy.calculate_invoice_update(invoice.__invoice_id_pk, user);
        const responds = await handy.getInvoice(0, invoice.__invoice_id_pk, 0, user, true);
        (responds.data && responds.data[0]) && invoice_data.push(responds.data[0]);
      }
    }

    if (rental.damage > 0) {
      const invoice_update_data = {
        _rental_id_fk: rental_id,
        _client_id_fk: rental._client_id_fk,
        //_tax_rate_id_fk: "0.1",//have to check
        type: "INVOICE",
        due_date: new Date(),
        selected_company_no: rental.selected_company_no,
        summary: "INVOICE FOR DAMAGES OR OTHER COST",
        date: new Date(),
        date_start: rental.date,
        date_end: rental.date_end
      };
      let invoice_count_next = "";
      if (rental.get("unstored_count_invoices") > 0) {
        if (rental.get("unstored_count_invoices") <= invoice_serial_no) {
          invoice_count_next = "." + ++invoice_serial_no;
          invoice_update_data.invoice_serial_no = invoice_serial_no;
        } else {
          invoice_count_next = "." + rental.get("unstored_count_invoices");
          invoice_update_data.invoice_serial_no = rental.get("unstored_count_invoices");
        }
      }
      //let invoice_count_next = rental.get("unstored_count_invoices") > 0 ? "." + rental.get("unstored_count_invoices") : "";
      invoice_update_data.invoice_id_no = rental.get("__rental_id_pk") + invoice_count_next;
      let invoice_damage = await Invoice.create(invoice_update_data);
      await Rental.update({ unstored_count_invoices: rental.unstored_count_invoices + 1 }, { where: { '__rental_id_pk': rental_id } });
      if (invoice_damage && invoice_damage.__invoice_id_pk) {
        let invoice_item_damage = {
          _invoice_id_fk: invoice_damage.__invoice_id_pk,
          sku: "DAM01",
          item: rental.damage_description,
          qty: 1,
          unit_price: rental.damage,
          taxable: 1,
          units: 1
          //type:item.type//have to check
        }
        invoice_item_damage = await InvoiceItems.create(invoice_item_damage);
      }

      //await handy.calculate_invoice_update(invoice_damage.__invoice_id_pk, user);
      const responds = await handy.getInvoice(0, invoice_damage.__invoice_id_pk, 0, user, true);
      (responds.data && responds.data[0]) && invoice_data.push(responds.data[0]);
    }
    return { status: true, data: invoice_data };
  }

}

module.exports = invoice;