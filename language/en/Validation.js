var config = {
    add_client_before_invoice: 'Please add a client before creating an invoice',
    billing_date_not_found: 'Billing start date not found',
    company_id_mandatory: 'Company id is mandatory',
    company_and_user_id_mandatory: 'Comapny id and user id is mandatory',
    category_exist: 'Category already exist',
    client_miss: 'Please enter a client for the job before entering items.',
    customer_not_exist: 'Customer is deleted or not exist',
    country_code_not_found: 'Country code not found for send SMS',
    calendar_status_exist: 'This status already exist.',
    //company
    company_create: 'Company created successfully.',
    company_not_create: 'Company not created successfully.',
    damage_items_not_found: "There are no items in the Job. Please add items and try again.",
    email_validation: "Email already taken. Please try with different Email.",
    email_sent: 'Email sent successfully',
    email_sent_failed: 'Email send failed',
    email_add_wrong: 'Wrong `TO` email address',
    Exception: 'There is some exception please try after some time ....',
    file_upload_fail: 'There was an error while uploading your files.',
    file_upload_empty: 'There are no files in the request. Please add files and try again.',
    file_not_found: 'File not found!',
    file_del: 'File deleted successfully',
    //validation messages
    invalid_data: 'Invalid Data Passed Please Check Your Request',
    invalid_client: 'Client is not valid for the company',
    invalid_rental: 'Rental is not valid for the company',
    invalid_account_type: 'Invalid account type',
    invalid_access: 'Invalid access',
    invalid_inventory_id: 'Inventory id is not valid',
    invalid_delivery_type: 'Invalid delivery type',
    invoice_not_create: 'Invoice not created',
    item_not_found: 'Items not found',
    items_not_found_job: "There are no items in the job!",
    invoice_item_not_found: "There are no items in this rental! Please add items before creating an invoice or you can create a Blank Invoice.",
    item_not_found_job: 'There are no items in the job. Please add items and try again.',
    no_items_found: "There are no records to process!",
    login_user_log_out_successfully: 'User Logged Out Successfully',
    login_users_log_out_successfully: 'Users Logged Out Successfully',
    login_user_log_out_error: 'Unable To Logout',
    login_users_log_out_error: 'Unable To Logout Users',
    login: 'Please login to continue',
    login_invalid_username: 'Invalid Username',
    login_valid_user: 'Valid User',
    login_company_subscription_is_not_active: 'Company subscription is not active',
    login_user_log_in_successfully: 'User logged in successfully',
    login_maximum_limit_reached: 'Number of users logged in is reached to maximum users',
    login_invalid_password: 'Invalid Password',
    loss_pending: "Items need to be set to OUT before you can add loss",
    loss_in: "This item has been set to IN and loss can't be applied.",
    loss_qty: "The amount lost is greater than what is actually out!",
    message_sent: 'SMS sent successfully',
    message_sent_failed: 'SMS send failed',
    not_track_serial: 'This inventory is not track serial',
    not_log_in: 'User not logged in',
    not_access: 'You dont have the access for this request, Please contact administrator',
    no_loss: "There is no loss to clear!",
    order_updated: 'Order updated successfully',
    pin_exist: 'PIN must be unique and this pin is already being used!',
    partial_return_pending: "Items must be set to OUT before you can return items.",
    partial_return_more: "You are returning more items than are out!",
    print_statement_items_not_found: "There are no transactions in the selected date range. Please try another date range.",
    rate_not_create: 'Failed to create rates',
    record_not_inserted: 'Record not inserted successfully',
    record_not_updated: 'Record not updated successfully',
    record_updated: 'Record updated successfully',
    record_inserted: 'Records inserted successfully',
    record_not_deleted: 'Record not deleted successfully',
    record_deleted: 'Record deleted successfully',
    image_not_deleted: 'Image not deleted successfully',
    image_deleted: 'Image deleted successfully',
    record_not_exist: 'Record not exist',
    record_not_found: 'Record not found!',
    rental_id_mandatory: 'Rental id is mandatory please check your request',
    rental_off_hire_full_alert: "The rental must be off hired before creating an off hire invoice. Click the off hire button on the top middle of the screen",
    rental_off_hire_full_billing_date_alert: "Long term billing is set to ON and no billing details have been set. Please set the billing parameter's before creating the invoice.",
    rental_already_invoiced: "This rental has already been invoiced. Do you want to create another invoice and what type?",
    // rental and rental item
    rental_delivery_alert: "Delivery must be on to use this feature!",
    rental_id_null: 'Rental id is null',
    rental_deposit_bond_alert: "You can't have a security bond and a deposit in the same job. Please clear the bond before adding a deposit.",
    partial_return_in_hourse_alert: "There are items set with hours out and no hours in! These amounts are updated to the inventory and need to be completed prior to off hiring the job.",
    rental_return_out_conformation: "These items have already been processed. Would you like to reset or cancel? Please note that Resetting will delete any off hires created and set the line items to pending!",
    rental_item_status_out: "This item has been set to out. Please use the IN button to return items.",
    report_failed: "Statement not created successfully",
    resource_id_not_exist: "Resource id not exist",
    select_files: 'Please select files to upload',
    serial_confirm: "There are less serial slots created than the current Quantity? Would you like to create the extra slots",
    serial_add_alert: "This serial has been added already!",
    serial_add_success: "Serial was added to the item name",
    service_invoice_exist: 'This service has already been invoiced.',
    sku_invalid: 'SkU value already exist',
    status_updated: 'Status updated successfully',
    subrent_count_alert: "There are sub rental items that haven't been assigned suppliers. Please add suppliers and try again.",
    subrent_delivery_pickup_alert: "Please select whether its delivery or pickup",
    subrent_delivery_pickup_date_alert: "Please select the delivery or pickup date",
    subrent_date_sent_confirmation: "A sub rental purchase order has already been sent. Would you like to send it again?",
    subrent_delivery_confirmation: "This job is set to be delivered and there is no delivery address set. Please go to the logistics tab and set up the delivery details",
    subrent_type_status: "This job is still in QUOTE status. Are you sure you want to send a Sub Rental PO?",
    subrent_supplier_empty: "There are no suppliers added to the Sub Rental system. Please add suppliers.",
    subrent_supplier_alert: "Add a Sub Rental Supplier to the first record and then press this button which will populate the supplier to all records.",
    token_refresh_success: 'Token refreshed successfully',
    temp_exist: 'Template name already exist',
    user_email_exist: 'User email already exist',
    user_id_mandatory: 'User id is mandatory',
    wrong_file_upload: 'File type not allowed',
    rental_item_not_found: 'There are no items added to the Rental. Please add items and try again.',
    rental_details_not_found: 'Rental data not found',
    invalid_task_id: 'Task id is not valid'
}
module.exports = config