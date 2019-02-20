import {Socket} from "socket.io";

export abstract class Component {

    socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;        
    }
}