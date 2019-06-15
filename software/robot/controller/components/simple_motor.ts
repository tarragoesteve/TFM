import { Component } from "../component";
import { Gpio } from "pigpio";
import { isNull } from "util";

export class SimpleMotor extends Component {
    PWM_reference: number = 0;

    PWM: Gpio;
    direction: Gpio;
    enable: Gpio;

    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //H Bridge Pinout
        this.PWM = new Gpio(this.parameters.pins.PWM, { mode: Gpio.OUTPUT });
        this.PWM.pwmFrequency(200);
        this.direction = new Gpio(this.parameters.pins.DIR, { mode: Gpio.OUTPUT });
        this.enable = new Gpio(this.parameters.pins.ENABLE, { mode: Gpio.OUTPUT });

        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (!isNull(msg.PWM_reference)) {
                this.PWM_reference = msg.PWM_reference;
                this.apply_output(this.PWM_reference);
            }
        })

        //Enable the motor
        this.enable.digitalWrite(1);
    }

    loop(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                //Get current state of the motor
                //Send state to the planner
                this.socket.emit('state', {
                    "motor": this.name, "PWM_reference": this.PWM_reference,
                })
            }, 1000);
        });
    }

    apply_output(output: number) {
            this.direction.digitalWrite(output > 0 ? 1 : 0)
            let dutyCycle = Math.floor(Math.min(1,Math.abs(output)) * 255)
            this.PWM.pwmWrite(dutyCycle)
    }
}