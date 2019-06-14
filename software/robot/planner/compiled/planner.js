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
    socket.on('state', function (msg) {
        console.log(msg);
    });
    socket.on('input', function (msg) {
        console.log(msg);
    });
});
var dutyCycle = 0;
setInterval(function () {
    dutyCycle += 5;
    if (dutyCycle > 200) {
        dutyCycle = 0;
    }
    for (var component_name in component_sockets) {
        component_sockets[component_name].emit('message', { 'PWM_reference': dutyCycle });
    }
}, 100);
