"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket = __importStar(require("socket.io"));
var server = socket.listen(3000);
var component_sockets = {};
server.on('connection', function (socket) {
    component_sockets[socket.handshake.query.name] = socket;
    console.log('Connection from: ', socket.handshake.query.name);
    socket.on('state', function (msg) {
        console.log(msg);
    });
    socket.on('input', function (msg) {
        console.log(msg);
        if (component_sockets["motor_left"]) {
            component_sockets["motor_left"].emit('message', { 'PWM_reference': msg.speed_left_ref });
        }
    });
});
