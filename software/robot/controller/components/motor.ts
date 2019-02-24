import {Component} from "../component";
import { Socket } from "socket.io";

export class Motor extends Component {
    constructor(name: string, planner_uri: string, is_simulation : boolean, parameters: any){
        super(name, planner_uri, is_simulation, parameters)
    }
}