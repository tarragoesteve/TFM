import { Component } from "../component";
import { PID } from "./utils/PID";
import { Motor, ReferenceParameter } from "./motor";
import { Accelerometer } from "./accelerometer";
import { isNumber } from "util";

export class Stabilizer extends Component {
    inclination: number = 0;
    inclination_reference: number = 0;
    position_reference: number = 0;
    PWM_reference: number = 0;
    reference_parameter: ReferenceParameter = ReferenceParameter.PWM;

    stabilizer_motor: Motor;

    accelerometer: Accelerometer;
    PID: PID;



    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);

        //Initialize subcomponents
        this.stabilizer_motor = new Motor('stabilizer_motor', planner_uri, is_simulation, parameters.motor_parameters);
        this.accelerometer = new Accelerometer('accelerometer', planner_uri, is_simulation, parameters);

        //Load PID Configuration;
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d)

        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (isNumber(msg.PWM_reference)) {
                this.reference_parameter = ReferenceParameter.PWM;
                this.PWM_reference = msg.PWM_reference;
            }
            if (isNumber(msg.inclination_reference)) {
                this.reference_parameter = ReferenceParameter.Inclination;
                this.inclination_reference = msg.inclination_reference;
            }
            if (isNumber(msg.position_reference)) {
                this.reference_parameter = ReferenceParameter.Position;
                this.position_reference = msg.position_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.parameters.pendulum) {
                this.stabilizer_motor.loop()
            }
            let i = 0;
            setInterval(() => {
                let data = this.accelerometer.sensor.readSync();
                this.inclination = Math.atan2(data.accel.z, data.accel.x) - Math.PI / 2;
                //Compute output
                let output;
                if (this.reference_parameter == ReferenceParameter.PWM) {
                    output = this.PWM_reference;
                    //Apply output to the motor
                    this.stabilizer_motor.apply_output(output)
                } else if (this.parameters.pendulum) {
                    if(this.reference_parameter == ReferenceParameter.Inclination){
                        let error = this.compute_error();
                        output = this.PID.output(error);
                        output = Math.min(1,Math.max(-1,output)) * Math.PI/4;
                    } else {
                        output = this.position_reference;
                    }
                    this.stabilizer_motor.reference_parameter = ReferenceParameter.Position;
                    this.stabilizer_motor.position_reference = output - this.inclination;
                } else {
                    let error = this.compute_error();
                    output = this.PID.output(error);
                    //Apply output to the motor
                    this.stabilizer_motor.apply_output(output)
                }
                //Send state to the UI
                if (i >= 5) {
                    console.log(this.inclination);
                    this.socket.emit('state', {
                        "motor": this.name, "data": data,
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