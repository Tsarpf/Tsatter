var socketio;

module.exports =  function(server) {
   if(!socketio) {
       socketio = require('socket.io')(server);
       return socketio;
   }
   else {
       console.log('returning old server!');
       return socketio;
   }
}

