const fastify = require("./routs");
const {Log} = require("../models/Model")(["Log"]);
fastify.rooms = {};
/**
 * @author Kirankumar
 * @summary This function is used for subscribe the socket room
 * @param {HTTP request} req 
 * @param {Socket Connection} connection 
 * @param {Room name} name 
 * @returns Room or false
 */
fastify.subscribe = (req, connection, name) => {
  const {table, id} = req.headers;
  const socket_key = req.headers["sec-websocket-key"]
  if(socket_key && table && id){
    room = table+"_"+id;
    if(!fastify.rooms[room])
    fastify.rooms[room] = {};
    fastify.rooms[room][socket_key] = {connection,name};
    return room;
  }else{
    return false;
  }  
}
/**
 * @author Kirankumar
 * @summary This function is used for un subscribe the room
 * @param {Http request} req 
 * @returns true
 */
fastify.unSubscribe = (req) => {
  const {table, id} = req.headers;
  const socket_key = req.headers["sec-websocket-key"]
  if(socket_key && table && id){
    room = table+"_"+id;
    if(fastify.rooms[room] && fastify.rooms[room][socket_key]){
      if(fastify.rooms[room].lock_by && fastify.rooms[room].lock_by == socket_key){
        fastify.rooms[room].lock_by = false;
      }
      delete fastify.rooms[room][socket_key];
    }
      
    if(fastify.rooms[room] && !Object.keys(fastify.rooms[room]).length == 1){
      delete fastify.rooms[room];
    }
    return true;
  }else{
    return true;
  }  
}
/**
 * @author Kirankumar
 * @summary This functon is used for lock edit mode to socket room
 * @param {Socket room} room 
 * @param {Socket id} socket_key 
 * @returns Socket key or false
 */
fastify.setLock = (room,socket_key) =>{
  if(fastify.rooms[room] && !fastify.rooms[room].lock_by){
    fastify.rooms[room].lock_by = socket_key;
    return socket_key;
  }else{
    return false;
  }
}

/**
 * @author Kirankumar
 * @summary This functon is used for un lock edit mode to socket room
 * @param {Socket room} room 
 * @param {Socket id} socket_key 
 * @returns true or false
 */
fastify.unLock = (room,socket_key) =>{
  if(fastify.rooms[room] && fastify.rooms[room].lock_by == socket_key){
    fastify.rooms[room].lock_by = false;
    fastify.sendInRoom(room,JSON.stringify({status:true,message:"Record un locked"}));
    return true;
  }else{
    return false;
  }
}

/**
 * @author Kirankumar
 * @summary This function is used for get the room locked user name
 * @param {Socket room} room 
 * @returns name or ""
 */
fastify.lockBy = (room) =>{
  if(fastify.rooms[room] && fastify.rooms[room].lock_by && fastify.rooms[room][fastify.rooms[room].lock_by]){
    return fastify.rooms[room][fastify.rooms[room].lock_by].name;
  }else{
    return "";
  }
}
/**
 * @author Kirankumar
 * @summary This function is used for get socket room object
 * @param {Socket room} room 
 * @returns Socket room or ""
 */
fastify.getRoom = (room) =>{
  if(fastify.rooms[room] && fastify.rooms[room]){
    return fastify.rooms[room];
  }else{
    return "";
  }
}
/**
 * @author Kirankumar
 * @summary This function is used for send data to inside room connections
 * @param {Socket room} room 
 * @param {Response data} data 
 * @returns void
 */
fastify.sendInRoom = (room,data) => {
  if(fastify.rooms[room] && fastify.rooms[room]){
    const socket_room = fastify.rooms[room];
    Object.keys(socket_room).forEach(key => {
      if(key != "lock_by" && socket_room[key] && socket_room[key].connection.socket._readyState == 1){
          socket_room[key].connection.socket.send(data);
      }
    })
  }
  
}
/**
 * @author Kirankumar
 * @summary This hook is used for update the req data to log's in db
 */
fastify.addHook('onResponse', async (request, reply) => {
  try{
    let {url,body,method,ip} = request;
    body = JSON.stringify(body);
    Log.create({uri:url,params:body,method,ip_address:ip,response_code:reply.statusCode,api_key:request.headers.authorization,authorized:reply.athenticated?1:0});
  }catch(e){
    console.log(e);
  }
})

module.exports = fastify;