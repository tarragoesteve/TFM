import { Component } from "../component";
import { Gpio } from "pigpio";
import { isNull } from "util";


enum Direction {
    Forward,
    Backward,
    Stop,
}

export class SimpleMotor extends Component {
    PWM_reference: number = 0;
    direction: Direction = Direction.Stop;

    PWM: Gpio;
    in_1: Gpio;
    in_2: Gpio;

    private getReferenceDirection(output: number) {
        if (output > 0) return Direction.Forward;
        if (output < 0) return Direction.Backward;
        return Direction.Stop;
    }

    private changeDirection(direction: Direction) {
        switch (direction) {
            case Direction.Forward:
                this.in_1.digitalWrite(1);
                this.in_2.digitalWrite(0);
                break;
            case Direction.Backward:
                this.in_1.digitalWrite(0);
                this.in_2.digitalWrite(1);
                break;
            case Direction.Stop:
                this.in_1.digitalWrite(0);
                this.in_2.digitalWrite(0);
                break;
            default:
                this.in_1.digitalWrite(0);
                this.in_2.digitalWrite(0);
                break;
        }
    }

    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //H Bridge Pinout
        this.PWM = new Gpio(this.parameters.pins.PWM, { mode: Gpio.OUTPUT });
        this.PWM.pwmFrequency(200);
        this.in_1 = new Gpio(this.parameters.pins.IN1, { mode: Gpio.OUTPUT });
        this.in_2 = new Gpio(this.parameters.pins.IN2, { mode: Gpio.OUTPUT });

        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (!isNull(msg.PWM_reference)) {
                this.PWM_reference = msg.PWM_reference;
                this.apply_output(this.PWM_reference);
            }
        })

        this.in_1.digitalWrite(0);
        this.in_2.digitalWrite(0);
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
        if(this.getReferenceDirection(output)!= this.direction){
            this.changeDirection(this.getReferenceDirection(output));
        }
        let dutyCycle = Math.floor(Math.min(1, Math.abs(output)) * 255)
        this.PWM.pwmWrite(dutyCycle)
    }
}