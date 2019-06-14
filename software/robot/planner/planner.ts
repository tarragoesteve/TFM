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


let dutyCycle = 0;

setInterval(()=>{
    dutyCycle += 5;
    if (dutyCycle > 200) {
      dutyCycle = 0;
    }
    for(let component_name in component_sockets){
        component_sockets[component_name].emit('message', {'PWM_reference': dutyCycle})
    }
},100)