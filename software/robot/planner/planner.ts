import * as socket from "socket.io";

let server = socket.listen(3000)
let component_sockets : any = {}

server.on('connection', function(socket: socket.Socket){
    component_sockets[socket.handshake.query.name] = socket;
    console.log('Connection from: ', socket.handshake.query.name);
    

    socket.on('state',(msg)=>{
        console.log(msg);
    })

    socket.on('input',(msg)=>{
        for(let component in msg){
            if(component_sockets[component]){
                component_sockets[component].emit('message', msg[component])
            }
        }
    })
});