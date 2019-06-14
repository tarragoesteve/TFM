import * as socket from "socket.io";

let server = socket.listen(3000)
let component_sockets : any = {}

server.on('connection', function(socket: socket.Socket){
    component_sockets[socket.handshake.query.name] = socket;
    console.log('Connection from: ', socket.handshake.query.name);
    

    socket.on('state',(msg)=>{
        //console.log(msg);
    })

    socket.on('input',(msg)=>{
        if(component_sockets["motor_left"]){
            component_sockets["motor_left"].emit('message', {'PWM_reference': msg.speed_left_ref})
        }
    })
});