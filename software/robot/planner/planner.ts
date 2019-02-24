import * as socket from "socket.io";

let server = socket.listen(3000)

server.on('connection', function(socket: socket.Socket){
    socket.on('message',(msg)=>{
        console.log(msg);
        
    })
    console.log('a user connected');
});