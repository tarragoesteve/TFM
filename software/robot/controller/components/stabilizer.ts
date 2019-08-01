import { Component } from "../component";
import { PID } from "./utils/PID";
import { Gpio } from "pigpio";
import { Motor } from "./motor";
import { Accelerometer } from "./accelerometer";
import { isNumber } from "util";
import { ReferenceParameter } from "./motor";

export class Stabilizer extends Component {
    inclination: number = 0;
    inclination_reference: number = 0;
    PWM_reference: number = 0;
    reference_parameter : ReferenceParameter = ReferenceParameter.PWM;

    stabilizer_motor : Motor;

    accelerometer : Accelerometer;
    PID : PID;



    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);

        //Initialize subcomponents
        this.stabilizer_motor = new Motor('stabilizer_motor',planner_uri,is_simulation,parameters);
        this.accelerometer = new Accelerometer('accelerometer',planner_uri,is_simulation,parameters);
        
        //Load PID Configuration;
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d)        
        
        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (isNumber(msg.PWM_reference)) {
                this.reference_parameter = ReferenceParameter.PWM;
                this.PWM_reference = msg.PWM_reference;
            }
            if (isNumber(msg.inclination_reference)) {
                this.inclination_reference = msg.inclination_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        let i =0;
        return new Promise((resolve, reject) => {
            setInterval(() => {
                let data = this.accelerometer.sensor.readSync();
                this.inclination = Math.atan2(data.accel.z,data.accel.x);
                //Compute output
                let output;
                if(this.reference_parameter == ReferenceParameter.PWM){
                    output = this.PWM_reference;
                } else {
                    let error = this.compute_error();
                    output = this.PID.output(error);                    
                }
                //Apply output to the motor
                this.stabilizer_motor.apply_output(output)
                //Send state to the UI
                if (i >= 5) {
                    console.log(this.inclination);
                    
                    this.socket.emit('state', {
                        "component": this.name, "data": data,
                        "inclination": this.inclination,
                        "inclination_reference": this.inclination_reference,
                        "PWM": output, time: Date.now()
                    })
                    i = 0;
                }
                i++;
            }, 20);
        });
    }

    private compute_error() {
        return this.inclination_reference - this.inclination;
    }
}