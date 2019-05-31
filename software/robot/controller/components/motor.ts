import {Component} from "../component";
import {PID} from "./utils/PID";
import { Gpio } from "pigpio";

export class Motor extends Component {
    position: number;
    speed : number;
    acceleration : number;

    position_reference: number;
    speed_reference: number;
    acceleration_reference: number;
    reference_parameter: string;

    PID: PID;

    constructor(name: string, planner_uri: string, is_simulation : boolean, parameters: any){
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        this.position = this.speed = this.acceleration =  0.0;
        this.position_reference = this.speed_reference = this.acceleration_reference = 0.0;
        //Load PID Configuration;
        this.PID = new PID(parameters.k_p,parameters.k_i,parameters.k_d)
        this.reference_parameter = parameters.reference_parameter;

        //Update the reference when we get a msg
        this.socket.on('message',(msg: any)=>{
            if(msg.position_reference){
                this.reference_parameter = 'position';
                this.position_reference = msg.position_reference;
            } 
            if(msg.speed_reference){
                this.reference_parameter = 'speed';
                this.speed_reference = msg.speed_reference;
            } 
            if(msg.acceleration_reference){
                this.reference_parameter = 'acceleration'
                this.acceleration_reference = msg.acceleration_reference;
            } 
        })
    }

    loop(): Promise<boolean>
    {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                //Get current state of the motor
                //Send state to the planner
                this.socket.emit('state',{"motor": this.name,"position": this.position,
                "speed": this.speed, "acceleration": this.acceleration})

                //Compute output
                let error = this.compute_error();
                let output = this.PID.output(error);
                
                //Apply output to the motor
                if(this.is_simulation){
                    console.log(output);                
                    this.speed = this.speed_reference*0.9;
                }
            }, 100);
          });
    }

    private compute_error() {
        if(this.reference_parameter == 'position'){
            return this.position_reference - this.position;
        }
        if (this.reference_parameter == 'speed'){
            return this.speed_reference - this.speed;
        } 
        if (this.reference_parameter == 'acceleration'){
            return this.acceleration_reference - this.acceleration;
        }
        console.log("Error computing error");
        return 0;
    }
}