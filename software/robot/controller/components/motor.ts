import { Component } from "../component";
import { PID } from "./utils/PID";
import { Filter } from "./utils/Filter";
import { Gpio } from "pigpio";
import { isNumber } from "util";


enum Direction {
    Forward,
    Backward,
    Stop,
}

enum ReferenceParameter {
    Position,
    Speed,
    Acceleration,
    PWM,
}

export class Motor extends Component {
    //State
    position: number = 0;
    speed: number = 0;
    acceleration: number = 0;
    direction: Direction = Direction.Stop;
    
    //Reference
    reference_parameter: ReferenceParameter = ReferenceParameter.PWM;
    position_reference: number = 0;
    speed_reference: number = 0;
    acceleration_reference: number = 0;
    PWM_reference: number = 0;

    speed_filter : Filter;


    PID: PID;

    //PINS
    PWM: Gpio;
    encoder_A: Gpio;
    encoder_B: Gpio;
    in_1: Gpio;
    in_2: Gpio;

    //Constants
    motor_reduction = 34;
    counts_per_revolution = 11;
    elapsed_radians = Math.PI / 2 / (this.counts_per_revolution * this.motor_reduction);

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

    //tick is the where we store the encoder flags
    encoder_flags: any = {};

    update_state() {
        /*Incremental encoders often output signals on two channels – typically termed “A” and “B” – 
        offset by 90 degrees (in quadrature). The direction of rotation can be determined by 
        which channel is leading. Generally, if channel A is leading, the direction is taken to be clockwise,
        and if channel B is leading, the direction is counterclockwise.*/
        if (this.encoder_flags['A'] && this.encoder_flags['B']) {
            let delta_time = (this.encoder_flags['A'].tick >> 0) - (this.encoder_flags['B'].tick >> 0);
            let clockwise: boolean;
            if (delta_time > 0) {
                clockwise = (this.encoder_flags['A'].level != this.encoder_flags['B'].level)
            } else {
                clockwise = (this.encoder_flags['A'].level == this.encoder_flags['B'].level)
            }
            let elapsed_seconds = Math.abs(delta_time) * 10E-8;
            let new_speed = this.elapsed_radians / elapsed_seconds;
            //console.log("delta_time",delta_time,"elapsed_seconds",elapsed_seconds,"new_speed",new_speed);
            
            if (!clockwise) {
                new_speed = -new_speed;
                this.position -= this.elapsed_radians;
            } else {
                this.position += this.elapsed_radians;
            }
            this.acceleration = (new_speed - this.speed) / elapsed_seconds;
            this.speed = this.speed_filter.addSample(new_speed);
        }
    }

    encoder_alert(encoder: string) {
        return ((level: number, tick: number) => {
            this.encoder_flags[encoder] = {
                level: level,
                tick: tick,
            }
            //console.log("encoder",encoder,"level",level,"tick",tick,"Date.now()",Date.now());            
            this.update_state();
        })
    }


    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //Load PID Configuration;
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d);

        //H Bridge Pinout
        this.PWM = new Gpio(this.parameters.pins.PWM, { mode: Gpio.OUTPUT });
        this.PWM.pwmFrequency(200);
        this.in_1 = new Gpio(this.parameters.pins.IN1, { mode: Gpio.OUTPUT });
        this.in_2 = new Gpio(this.parameters.pins.IN2, { mode: Gpio.OUTPUT });
        //Motor stop
        this.changeDirection(Direction.Stop)

        //Encoder Pinout
        this.encoder_A = new Gpio(this.parameters.pins.Encoder_A, { mode: Gpio.INPUT });
        this.encoder_B = new Gpio(this.parameters.pins.Encoder_B, { mode: Gpio.INPUT });

        // Alerts to trigger encoder flags
        this.encoder_A.enableAlert()
        this.encoder_A.glitchFilter(100);
        this.encoder_B.enableAlert()
        this.encoder_B.glitchFilter(100);
        this.encoder_A.on('alert', this.encoder_alert('A'));
        this.encoder_B.on('alert', this.encoder_alert('B'));

        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (isNumber(msg.position_reference)) {
                this.reference_parameter = ReferenceParameter.Position;
                this.position_reference = msg.position_reference;
            }
            if (isNumber(msg.speed_reference)) {
                this.reference_parameter = ReferenceParameter.Speed;
                this.speed_reference =100* msg.speed_reference;
            }
            if (isNumber(msg.acceleration_reference)) {
                this.reference_parameter = ReferenceParameter.Acceleration;
                this.acceleration_reference = msg.acceleration_reference;
            }
            if (isNumber(msg.PWM_reference)) {
                this.reference_parameter = ReferenceParameter.PWM;
                this.PWM_reference = msg.PWM_reference;
            }
        })

        this.speed_filter = new Filter(20);
    }

    loop(): Promise<boolean> {
        let i = 0;
        return new Promise((resolve, reject) => {
            setInterval(() => {
                let output: number;
                if(this.reference_parameter == ReferenceParameter.PWM){
                    output = this.PWM_reference;
                } else {
                    let error = this.compute_error();
                    output = this.PID.output(error);
                }
                //Apply output to the motor
                this.apply_output(output);

                //Send state to the planner
                if (i >= 50) {
                    this.socket.emit('state', {
                        "motor": this.name, "position": this.position,
                        "speed": this.speed, "acceleration": this.acceleration,
                        "output": output,
                    })
                    i = 0;
                }
                i++;

            }, 20);
        });
    }

    apply_output(output: number) {
        if (this.getReferenceDirection(output) != this.direction) {
            this.changeDirection(this.getReferenceDirection(output));
        }
        let dutyCycle = Math.floor(Math.min(1, Math.abs(output)) * 255)
        this.PWM.pwmWrite(dutyCycle)
    }

    private compute_error() {
        switch (this.reference_parameter) {
            case ReferenceParameter.Position:
                return this.position_reference - this.position;
            case ReferenceParameter.Speed:
                return this.speed_reference - this.speed;
            case ReferenceParameter.Acceleration:
                return this.acceleration_reference - this.acceleration;
            default:
                console.log("Error computing error");
                return 0;
        }
    }
}