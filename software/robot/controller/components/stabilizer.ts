import { Component } from "../component";
import { PID } from "./utils/PID";
import { Motor, ReferenceParameter } from "./motor";
import { Accelerometer } from "./accelerometer";
import { isNumber } from "util";
import { Filter } from "./utils/Filter";


export class Stabilizer extends Component {
    inclination: number = 0;
    inclination_reference: number = 0;
    position_reference: number = 0;
    PWM_reference: number = 0;
    reference_parameter: ReferenceParameter = ReferenceParameter.PWM;

    stabilizer_motor: Motor;

    accelerometer: Accelerometer;
    PID: PID;
    filter :Filter;



    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);

        this.filter = new Filter(10)

        //Initialize subcomponents
        this.stabilizer_motor = new Motor('stabilizer_motor', planner_uri, is_simulation, parameters.motor_parameters);
        this.accelerometer = new Accelerometer('accelerometer', planner_uri, is_simulation, parameters);

        //Load PID Configuration;
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d)
        this

        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (isNumber(msg.PWM_reference)) {
                this.stabilizer_motor.reference_parameter = this.reference_parameter = ReferenceParameter.PWM;
                this.stabilizer_motor.PWM_reference = this.PWM_reference = msg.PWM_reference;
            }
            if (isNumber(msg.position_reference)) {
                this.reference_parameter = ReferenceParameter.Position;
                this.position_reference = msg.position_reference;
            }
            if (isNumber(msg.inclination_reference)) {
                this.reference_parameter = ReferenceParameter.Inclination;
                this.inclination_reference = msg.inclination_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let i = 0;
            setInterval(() => {
                let data = this.accelerometer.sensor.readSync();
                this.inclination = this.filter.addSample(Math.atan2(data.accel.z, data.accel.x) - Math.PI / 2);
                //Compute output
                if(this.inclination>Math.PI) this.inclination -= 2 * Math.PI
                if (this.inclination<-Math.PI) this.inclination += 2 * Math.PI
                let output = 0;
                switch (this.reference_parameter) {
                    case ReferenceParameter.PWM:
                        break;
                    case ReferenceParameter.Position:
                        this.stabilizer_motor.reference_parameter = ReferenceParameter.Position;
                        this.stabilizer_motor.position_reference = this.position_reference;
                        break;
                    case ReferenceParameter.Inclination:
                            let error = this.compute_error();
                            output = this.PID.output(error);
                            if (this.parameters.pendulum) {
                                output = Math.min(1, Math.max(-1, output)) * Math.PI / 4;
                                this.stabilizer_motor.reference_parameter = ReferenceParameter.Position;
                                this.stabilizer_motor.position_reference = output - this.inclination;
                            } else {
                                this.stabilizer_motor.reference_parameter = ReferenceParameter.PWM;
                                this.stabilizer_motor.PWM_reference = output;
                            }                
                        break;
                
                    default:
                        this.stabilizer_motor.reference_parameter = ReferenceParameter.PWM;
                        this.stabilizer_motor.position_reference = 0;        
                        break;
                }
                this.stabilizer_motor.loop_iteration();
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
        })
    }

    private compute_error() {
        return this.inclination_reference - this.inclination;
    }
}