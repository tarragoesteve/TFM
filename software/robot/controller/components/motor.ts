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

export enum ReferenceParameter {
    Position,
    Speed,
    PWM,
    Inclination,
}

export class Motor extends Component {
    //State
    previous_position_counter :number = 0;
    position_counter: number = 0;
    direction: Direction = Direction.Stop;
    
    //Reference
    reference_parameter: ReferenceParameter = ReferenceParameter.PWM;
    position_reference: number = 0;
    speed_reference: number = 0;
    acceleration_reference: number = 0;
    PWM_reference: number = 0;

    PID: PID;

    //PINS
    PWM: Gpio;
    encoder_A: Gpio;
    encoder_B: Gpio;
    in_1: Gpio;
    in_2: Gpio;

    //Constants
    static readonly PWM_limit = 1;
    static readonly motor_reduction = 34;
    static readonly pulse_per_revolution = 341.2;
    static readonly counts_per_revolution = 4* Motor.pulse_per_revolution;
    static readonly corrector = 1.4511;
    static readonly elapsed_radians = Motor.corrector* Math.PI * 2/Motor.counts_per_revolution;
    static readonly loop_ms = 20;

    static getReferenceDirection(output: number) {
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
            if (!clockwise) {
                this.position_counter --;
            } else {
                this.position_counter ++;
            }
        }
    }

    encoder_alert(encoder: string) {
        return ((level: number, tick: number) => {
            this.encoder_flags[encoder] = {
                level: level,
                tick: tick,
            }
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
                this.position_reference =2*Math.PI* msg.position_reference;
            }
            if (isNumber(msg.speed_reference)) {
                this.reference_parameter = ReferenceParameter.Speed;
                this.speed_reference =25* msg.speed_reference;
            }
            if (isNumber(msg.PWM_reference)) {
                this.reference_parameter = ReferenceParameter.PWM;
                this.PWM_reference = msg.PWM_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        let i = 0;
        return new Promise((resolve, reject) => {
            setInterval(() => {
                let output: number;
                //Compute new speed and acceleration
                if(this.reference_parameter == ReferenceParameter.PWM){
                    output = this.PWM_reference;
                } else {
                    let error = this.compute_error();
                    output = this.PID.output(error);
                }
                //Apply output to the motor
                this.apply_output(output);

                //Send state to the planner
                if (i >= 5) {
                    this.socket.emit('state', {
                        "motor": this.name, "position": this.position_counter * Motor.elapsed_radians,
                        "speed": (this.position_counter - this.previous_position_counter)*Motor.elapsed_radians*1000.0/Motor.loop_ms,
                        PWM: output, reference_parameter: this.reference_parameter,
                        position_reference: this.position_reference, speed_reference: this.speed_reference,
                        PWM_reference: this.PWM_reference, time: Date.now()
                    })
                    i = 0;
                }
                i++;
                this.previous_position_counter = this.position_counter;

            }, Motor.loop_ms);
        });
    }

    apply_output(output: number) {
        if (Motor.getReferenceDirection(output) != this.direction) {
            this.changeDirection(Motor.getReferenceDirection(output));
        }
        let dutyCycle = Math.floor(Math.min(Motor.PWM_limit, Math.abs(output)) * 255)
        this.PWM.pwmWrite(dutyCycle)
    }

    private compute_error() {
        switch (this.reference_parameter) {
            case ReferenceParameter.Position:
                return this.position_reference - this.position_counter * Motor.elapsed_radians;
            case ReferenceParameter.Speed:
                return this.speed_reference - (this.position_counter - this.previous_position_counter)*Motor.elapsed_radians*1000.0/Motor.loop_ms;
            default:
                console.log("Error computing error");
                return 0;
        }
    }
}