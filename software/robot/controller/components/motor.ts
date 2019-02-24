import {Component} from "../component";

export class Motor extends Component {
    position: number;
    speed : number;
    acceleration : number;

    position_reference: number;
    speed_reference: number;
    acceleration_reference: number;
    reference_parameter: string;

    k_p: number;
    k_i: number;
    k_d: number;
    PID_previous_error: number;
    PID_accumulated_error: number;
    PID_previous_error_time: number; 

    constructor(name: string, planner_uri: string, is_simulation : boolean, parameters: any){
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        this.position = this.speed = this.acceleration =  0.0;
        this.position_reference = this.speed_reference = this.acceleration_reference = 0.0;
        this.PID_previous_error = this.PID_accumulated_error = 0.0;
        //Load PID Configuration;
        this.k_p = parameters.k_p;
        this.k_i = parameters.k_i;
        this.k_d = parameters.k_d;
        this.reference_parameter = parameters.reference_parameter;
        this.PID_previous_error_time = Date.now()

        this.socket.on('message',(msg: any)=>{
            this.position_reference = msg.position_reference;
            this.speed_reference = msg.speed_reference;
            this.acceleration_reference = msg.acceleration_reference;
        })
    }

    loop(): Promise<boolean>
    {
        return new Promise((resolve, reject) => {
            //Get current state of the motor
            //Send state to the planner
            this.socket.emit('state',{"motor": this.name,"position": this.position,
             "speed": this.speed, "acceleration": this.acceleration})

            //Compute output
            let next_error = this.compute_error();
            let time_window = Date.now() - this.PID_previous_error_time;
            this.PID_previous_error_time = Date.now();
            this.PID_accumulated_error += next_error * time_window;
            let output = next_error * this.k_p
                + this.PID_accumulated_error * this.k_i 
                + (next_error - this.PID_previous_error) / time_window;

            
            //Apply output to the motor
            
            this.speed = this.speed_reference*0.9;

            
            //Repeat loop after it ends
            setTimeout(() => {
                return this.loop();                
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