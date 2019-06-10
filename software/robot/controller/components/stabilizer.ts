import { Component } from "../component";
import { PID } from "./utils/PID";
import { Gpio } from "pigpio";
import { Motor } from "./motor";
import { Accelerometer } from "./accelerometer";

export class Stabilazer extends Component {
    inclination: number;
    inclination_reference: number;

    stabilazer_motor : Motor;

    accelerometer : Accelerometer;
    PID : PID;



    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        this.inclination = this.inclination_reference = 0;

        //Inicialize subcomponents
        this.stabilazer_motor = new Motor('stabilazer_motor',planner_uri,is_simulation,parameters);
        this.accelerometer = new Accelerometer('accelerometer',planner_uri,is_simulation,parameters);
        
        //Load PID Configuration;
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d)
        
        
        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (msg.inclination_reference) {
                this.inclination_reference = msg.inclination_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                //Get current state
                this.inclination = this.accelerometer.getInclination();
                //Send state to the planner
                this.socket.emit('state', {
                    "component": this.name, "inclination": this.inclination
                })

                //Compute output
                let error = this.compute_error();
                let output = this.PID.output(error);

                //Apply output to the motor
                this.stabilazer_motor.apply_output(output)
            }, 100);
        });
    }

    private compute_error() {
        return this.inclination_reference - this.inclination;
    }
}