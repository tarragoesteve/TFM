import * as socket from "socket.io";

let server = socket.listen(3000)

server.on('connection', function(socket: any){
    console.log('a user connected');
});