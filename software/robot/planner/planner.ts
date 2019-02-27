import * as socket from "socket.io";

let server = socket.listen(3000)
let component_sockets : any = {}

server.on('connection', function(socket: socket.Socket){
    component_sockets[socket.handshake.query.name] = socket;

    socket.on('state',(msg)=>{
        console.log(msg);
    })

    socket.on('input',(msg)=>{
        console.log(msg);
    })
});

setInterval(()=>{
    for(let component_name in component_sockets){
        component_sockets[component_name].emit('message', {'speed_reference': 4.0})
    }
},3000)