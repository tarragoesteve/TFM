import {Component} from "../component";
import { Socket } from "socket.io";

export class Motor extends Component {
    position: number;
    speed : number;
    acceleration : number;

    constructor(name: string, planner_uri: string, is_simulation : boolean, parameters: any){
        super(name, planner_uri, is_simulation, parameters);
        this.position = this.speed = this.acceleration =  0.0;
    }

    loop(): Promise<boolean>
    {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.socket.emit('message',this.name)
                console.log(this.name);
                return this.loop();                
            }, 2000);
          });
    }
}