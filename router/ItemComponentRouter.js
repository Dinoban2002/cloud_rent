const { Inventory, InventoryComponent } = require("../models/Model")(
    ["Inventory", "InventoryComponent"]
);
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;

async function ItemComponentRouter(fastify, opts) {

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the inventory Component
     * @returns status and Updated data
     */
    fastify.post('/inventorycomponent/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_or_update_component(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create the multiple inventory Components
     * @input {Inventory ids for create components}
     * @returns status and Updated data
     */
    fastify.post('/inventorycomponent/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_components(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the inventory component
     * @param {Inventory component data} item_com_data 
     * @param {Logged in user} user 
     * @returns Status and created data
     */
    async function create_components(body, user) {
        if (body && body.component_ids && body.component_ids.length && body.inventory_id) {
            let inve_data = await Inventory.findAll({
                attributes: [
                    "price", "item",
                    ["__inventory_id_pk", "parent_inventory_id"],
                ], where: { __inventory_id_pk: body.component_ids }
            })
            inve_data = await handy.transformnames('RTL', inve_data, "InventoryComponent");
            let order = await InventoryComponent.max("sort_order", { where: { _inventory_id_fk: body.inventory_id } })
            order = order || 0;
            order += 1;
            if (inve_data.length) {
                for (key in inve_data) {
                    inve_data[key]._inventory_id_fk = body.inventory_id;
                    inve_data[key].quantity = 1;
                    inve_data[key].sort_order = order + parseInt(key);
                }
                let component_data = await InventoryComponent.bulkCreate(inve_data);
                component_data = await handy.transformnames('LTR', component_data, "InventoryComponent");
                return { status: true, data: component_data };
            } else {
                return { status: true, data: [] };
            }
        } else {
            return { status: false, message: lang("Validation.invalid_data", user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the inventory component
     * @param {Inventory component data} item_com_data 
     * @param {Logged in user} user 
     * @returns Status and updated data
     */
    async function create_or_update_component(item_com_data, user) {
        if (item_com_data && ((item_com_data.inventory_id && item_com_data.parent_inventory_id) || (item_com_data.inventory_component_id))) {
            const data = await handy.create_update_table(item_com_data, user, InventoryComponent, "InventoryComponent", "__inventory_component_id_pk");
            return data;
        } else {
            return { status: false, message: lang("Validation.invalid_data", user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This rout is used for delete the inventory component.
     * @param {inventory component id} component_id
     * @returns status and message
     */
    fastify.delete('/inventorycomponent/delete/:component_id', async (req, res) => {
        try {
            const user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.component_id) {
                const data = await InventoryComponent.destroy({ where: { __inventory_component_id_pk: req.params.component_id } });
                if (data) {
                    res.status(200).send({ status: true, message: lang("Validation.record_deleted", user.lang) });
                } else {
                    res.status(500).send({ status: false, message: lang("Validation.record_not_deleted", user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang("Validation.invalid_data", user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @deprecated 1.0.0
     * @param {inventory id} inventory_id 
     * @returns Status and list of component data
     */
    async function getItemComponent(inventory_id) {
        var data = await InventoryComponent.findAll({ attributes: { exclude: ["created_by", "updated_by", "created_at", "updated_at", "track_serial_numbers", "is_updated", "duplicates_value_list"] }, where: { _inventory_id_fk: inventory_id }, order: [["sort_order", "ASC"]] });
        data = data ? data : [];
        if (data.length) {
            data = handy.transformnames('LTR', data, "InventoryComponent");
        }
        return { status: true, data };
    }
    /**
    * @author Kirankumar
    * @deprecated 1.0.0
    */
    //   fastify.post('/inventorycomponent/create', async(req,res)=>{
    //     try{
    //         var user = await handy.verfiytoken(req,res);
    //         if(!user)return;
    //         var item_com_data = req.body;
    //         if(Object.keys(item_com_data).length && item_com_data.inventory_id){
    //             item_com_data = await handy.transformnames('RTL',item_com_data,"InventoryComponent");
    //             var data = await InventoryComponent.create(item_com_data);
    //             if(data.__inventory_component_id_pk){
    //                 data = await getItemComponent(item_com_data._inventory_id_fk);
    //                 res.status(200).send(data);
    //             }else{
    //                 res.status(501).send({status:false,message:lang("Validation.record_not_inserted",user.lang)});
    //             }
    //         }else{
    //             res.status(501).send({status:false,message:lang("Validation.invalid_data",user.lang)});
    //         }
    //     }catch(e){
    //         res.status(501).send(e);
    //     }
    // })

    /**
     * @author Kirankumar
     * @deprecated 1.0.0
     */
    //  fastify.put('/inventorycomponent/update/:component_id', async(req,res)=>{
    //     try{
    //         var user = await handy.verfiytoken(req,res);
    //         if(!user)return;
    //         var item_com_data = req.body;
    //         if(Object.keys(item_com_data).length && item_com_data.inventory_id){
    //             item_com_data = await handy.transformnames('RTL',item_com_data,"InventoryComponent");
    //             var data = await InventoryComponent.update(item_com_data,{where:{__inventory_component_id_pk:req.params.component_id}});
    //             data = await getItemComponent(item_com_data._inventory_id_fk);
    //             res.status(200).send(data);
    //         }else{
    //             res.status(501).send({status:false,message:lang("Validation.invalid_data",user.lang)});
    //         }
    //     }catch(e){
    //         res.status(501).send(e);
    //     }
    // })
}

module.exports = ItemComponentRouter;