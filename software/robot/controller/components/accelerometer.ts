import { Component } from "../component";
import { Gpio } from "pigpio";
import { I2cBus } from "i2c-bus";

export class Accelerometer extends Component {
    inclination: number;
    inclination_reference: number;



    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        this.inclination = this.inclination_reference = 0;

        
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
                //Get current state of the motor
                //Send state to the planner
                this.socket.emit('state', {
                    "component": this.name, "inclination": this.inclination
                })

            }, 100);
        });
    }

    getInclination(): number{
        return 0;
    }

    private compute_error() {
        return this.inclination_reference - this.inclination;
    }
}