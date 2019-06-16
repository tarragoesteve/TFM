import { Component } from "../component";
import { PID } from "./utils/PID";
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
    Acceleration
}

export class Motor extends Component {
    position: number = 0;
    speed: number = 0;
    acceleration: number;
    direction: Direction = Direction.Stop;

    position_reference: number;
    speed_reference: number;
    acceleration_reference: number;
    reference_parameter: ReferenceParameter = ReferenceParameter.Speed;
    PID: PID;

    PWM: Gpio;
    encoder_A: Gpio;
    encoder_B: Gpio;
    in_1: Gpio;
    in_2: Gpio;


    motor_reduction = 35;



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
            console.log("encoder_flags",this.encoder_flags);
            
            let delta_time = (this.encoder_flags['A'].tick >> 0) - (this.encoder_flags['B'].tick >> 0);
            console.log("delta_time",delta_time);            
            let clockwise: boolean;
            if (delta_time > 0) {
                //First B flag then A flag
                clockwise = (this.encoder_flags['A'].level != this.encoder_flags['B'].level)
            } else {
                //First A flag then B flag
                clockwise = (this.encoder_flags['A'].level == this.encoder_flags['B'].level)
            }
            console.log("clockwise",clockwise);
            
            let elapsed_seconds = Math.abs(delta_time) / 10e6;
            console.log("elapsed_seconds",elapsed_seconds);            
            let new_speed = (Math.PI / 2) / this.motor_reduction / elapsed_seconds;
            console.log("new_speed",new_speed);            
            if (!clockwise) new_speed = -new_speed;
            let mean_speed = (new_speed + this.speed) / 2;
            this.position += mean_speed * elapsed_seconds;
            this.acceleration = (new_speed - this.speed) / elapsed_seconds;
            this.speed = new_speed;
        }
    }

    encoder_alert(encoder: string) {
        return ((level: number, tick: number) => {
            this.encoder_flags[encoder] = {
                level: level,
                tick: tick,
            },
                this.update_state();
        })
    }


    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        this.position = this.speed = this.acceleration = 0.0;
        this.position_reference = this.speed_reference = this.acceleration_reference = 0.0;
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
        this.encoder_B.enableAlert()
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
                this.speed_reference = msg.speed_reference;
            }
            if (isNumber(msg.acceleration_reference)) {
                this.reference_parameter = ReferenceParameter.Acceleration;
                this.acceleration_reference = msg.acceleration_reference;
            }
        })
    }

    loop(): Promise<boolean> {
        let i = 0;
        return new Promise((resolve, reject) => {
            setInterval(() => {
                //Get current state of the motor
                //Send state to the planner
                if (i >= 0) {
                    this.socket.emit('state', {
                        "motor": this.name, "position": this.position,
                        "speed": this.speed, "acceleration": this.acceleration
                    })
                    i = 0;
                }
                i++;

                //Compute output
                let error = this.compute_error();
                console.log("error", error);
                let output = this.PID.output(error);
                console.log("output", output);
                //Apply output to the motor
                this.apply_output(output);
            }, 100);
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
                console.log(this.speed_reference);                
                return this.speed_reference - this.speed;
            case ReferenceParameter.Acceleration:
                return this.acceleration_reference - this.acceleration;
            default:
                console.log("Error computing error");
                return 0;
        }
    }
}