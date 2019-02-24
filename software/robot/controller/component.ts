import * as socketio from "socket.io-client";

export abstract class Component {

    name: string;
    planner_uri: string;
    is_simulation: boolean;
    socket: SocketIOClient.Socket;
    parameters: any;



    constructor(name: string, planner_uri: string, is_simulation : boolean, parameters: any) {
        this.name = name;
        this.planner_uri = planner_uri;
        this.is_simulation = is_simulation;
        this.socket = socketio.connect(planner_uri)
        this.parameters = parameters;

    }

    loop(): Promise<boolean>
    {
        return new Promise((resolve, reject) => {
            console.log(this.name,": Loop not implemented");
            resolve(true);
          });
    }
}