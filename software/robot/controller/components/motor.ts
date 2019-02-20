import {Component} from "../component";
import { Socket } from "socket.io";

export class Motor extends Component {
    constructor(socket: Socket){
        super(socket)
    }
}