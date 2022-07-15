var userprivilege = {
  "admin": ["rental_creation", "rental_deletion", "rental_updation", "inventory_creation", "inventory_deletion", "inventory_updation", "invoice_creation", "invoice_deletion", "invoice_updation", "payment_creation", "payment_deletion", "payment_updation", "client_creation", "client_updation", "client_deletion"],
  "sales": ["rental_creation", "rental_updation", "inventory_creation", "inventory_updation", "invoice_creation", "invoice_updation", "payment_creation", "payment_updation", "client_creation", "client_updation"],
  "driver": ["inventory_push"]
}

module.exports = userprivilege;