let handy = require("../config/common");
const tsc = require("../controllers/TaskServiceController.js");

async function TaskServiceRouter(fastify, opts) {
  /**
   * @author Bharath
   * @summary This rout is usefull to filter task data
   * @input kendo filter json
   * @return Status and List of filtered rental data
   */
  fastify.post('/task/get', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.get_tasks(req.body, user);
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
   * @author JoysanJawahar
   * @summary This route is useful to get data for driver login
   * @input kendo filter json
   * @return Status and List of filtered task data
   */
  fastify.post('/driver/task/get/:resource_id', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.get_driver_tasks(req, user);
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
  * @author Anik
  * @summary This rout is usefull to filter logistic task data
  * @input kendo filter json
  * @return Status and List of filtered rental data
  */
  fastify.post('/logistic/task/get', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.get_taskData(req, user);
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
 * @author Anik
 * @summary This rout is usefull to update task data
 * @input task_id and priority field
 * @return Status and updated task data
 */
  fastify.post('/logistic/update', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.update_taskData(req?.body, user);
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
   * @summary This rout is usefull to add resource to task
   * @return Status and List of added data
   */
  fastify.post('/task/resource/add', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.add_resource_to_task(req.body, user);
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
     * @summary This rout is usefull to add resource to task
     * @return Status and List of added data
     */
  fastify.post('/task/vehicle/add', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await tsc.add_vehicle_to_task(req.body, user);
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
  * @summary This rout is use full to filter Task data
  * @input kendo filter json
  * @return Status and List of filtered Task data
  */
  fastify.post('/task/pdf/get', async (req, res) => {
    try {
      let user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await handy.get_pdf(req.body, user);
      if (data.status) {
        res.status(200).send(data);
      } else {
        res.status(500).send(data);
      }
    } catch (e) {
      res.status(501).send(e);
    }
  })

}
module.exports = TaskServiceRouter;