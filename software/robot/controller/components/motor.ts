import { Component } from "../component";
import { PID } from "./utils/PID";
import { Gpio } from "pigpio";

export class Motor extends Component {
    position: number;
    speed: number;
    acceleration: number;

    position_reference: number;
    speed_reference: number;
    acceleration_reference: number;
    reference_parameter: string;

    PID: PID;

    PWM: Gpio;
    encoder_A: Gpio;
    encoder_B: Gpio;
    direction: Gpio;
    enable: Gpio;


    motor_reduction = 35;

    //tick is the where we store the encoder flags
    encoder_flags: any;

    update_state() {
        /*Incremental encoders often output signals on two channels – typically termed “A” and “B” – 
        offset by 90 degrees (in quadrature). The direction of rotation can be determined by 
        which channel is leading. Generally, if channel A is leading, the direction is taken to be clockwise,
        and if channel B is leading, the direction is counterclockwise.*/
        if (this.encoder_flags['A'] && this.encoder_flags['B']) {
            let delta_time = (this.encoder_flags['A'].tick >> 0) - (this.encoder_flags['B'].tick >> 0);
            let clockwise: boolean;
            if (delta_time > 0) {
                //First B flag then A flag
                clockwise = (this.encoder_flags['A'].level != this.encoder_flags['B'].level)
            } else {
                //First A flag then B flag
                clockwise = (this.encoder_flags['A'].level == this.encoder_flags['B'].level)
            }
            let elapsed_seconds = Math.abs(delta_time) / 10e6
            let new_speed = (Math.PI / 2) / this.motor_reduction / elapsed_seconds;
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
        this.PID = new PID(parameters.k_p, parameters.k_i, parameters.k_d)
        this.reference_parameter = parameters.reference_parameter;

        //H Bridge Pinout
        this.PWM = new Gpio(this.parameters.pins.PWM, { mode: Gpio.OUTPUT });
        this.PWM.pwmFrequency(1024);
        this.direction = new Gpio(this.parameters.pins.DIR, { mode: Gpio.OUTPUT });
        this.enable = new Gpio(this.parameters.pins.ENABLE, { mode: Gpio.OUTPUT });

        //Encoder Pinout
        this.encoder_A = new Gpio(this.parameters.pins.Enoder_A, { mode: Gpio.INPUT });
        this.encoder_B = new Gpio(this.parameters.pins.Enoder_B, { mode: Gpio.INPUT });

        // Alerts to trigger encoder flags
        this.encoder_A.enableAlert()
        this.encoder_B.enableAlert()
        this.encoder_A.on('alert', this.encoder_alert('A'));
        this.encoder_B.on('alert', this.encoder_alert('B'));


        //Configure the socket the reference when we get a msg
        this.socket.on('message', (msg: any) => {
            if (msg.position_reference) {
                this.reference_parameter = 'position';
                this.position_reference = msg.position_reference;
            }
            if (msg.speed_reference) {
                this.reference_parameter = 'speed';
                this.speed_reference = msg.speed_reference;
            }
            if (msg.acceleration_reference) {
                this.reference_parameter = 'acceleration'
                this.acceleration_reference = msg.acceleration_reference;
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
                    "motor": this.name, "position": this.position,
                    "speed": this.speed, "acceleration": this.acceleration
                })

                //Compute output
                let error = this.compute_error();
                let output = this.PID.output(error);

                //Apply output to the motor
                this.apply_output(output);
            }, 100);
        });
    }

    apply_output(output: number) {
        if (this.is_simulation) {
            console.log(output);
            this.speed = this.speed_reference * 0.9;
        } else {
            this.direction.digitalWrite(output > 0 ? 1 : 0)
            this.PWM.pwmWrite(output)
        }
    }

    private compute_error() {
        if (this.reference_parameter == 'position') {
            return this.position_reference - this.position;
        }
        if (this.reference_parameter == 'speed') {
            return this.speed_reference - this.speed;
        }
        if (this.reference_parameter == 'acceleration') {
            return this.acceleration_reference - this.acceleration;
        }
        console.log("Error computing error");
        return 0;
    }
}