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
server.on('connection', function (socket) {
    socket.on('message', function (msg) {
        console.log(msg);
        socket.emit('message', "I'm the planner");
    });
    console.log('a user connected');
});
