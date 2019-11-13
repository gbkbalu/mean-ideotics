
module.exports = function (socketio, Client) {
	
  socketio.on('connection', function (socket) {

      socket.emit('welcome', { message: 'Welcome!', id: socket.id });

      socket.on('connected',function(obj){
          if(obj.sessionId !== undefined && obj.sessionId !== null && obj.sessionId !== '')
          {
              socket.sessionId = obj.sessionId;
              console.log('connected 169::'+socket.sessionId);
          }

          if(socket.sessionId !== undefined && socket.sessionId !== null && socket.sessionId !== '')
          {
              console.log('connected 171::'+socket.sessionId);
              userStatus.setUserStatus(socket.sessionId,true,socket.request.connection.remoteAddress);
          }
      }) ;

      socket.on('disconnect', function () {
          console.log('socket logout::'+socket.request.connection.remoteAddress)
          if(socket.sessionId !== undefined && socket.sessionId !== null && socket.sessionId !== '')
          {
              console.log('disconnected 194::'+socket.sessionId);
              userStatus.setUserStatus(socket.sessionId,false,socket.request.connection.remoteAddress,true);
          }

      });
  });
};