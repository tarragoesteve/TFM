import { Component } from "../component";
import { PID } from "./utils/PID";
import { Gpio } from "pigpio";
import { AnyARecord } from "dns";

export class Motor extends Component {
    position: number;
    speed: number;
    acceleration: number;

    position_reference: number;
    speed_reference: number;
    acceleration_reference: number;
    reference_parameter: string;

    PID: PID;

    motor_power_pin: Gpio;
    encoder_A_pin: Gpio;
    encoder_B_pin: Gpio;
    h_bridge_pin: Gpio;

    motor_reduction = 35;

    //tick is the number of microseconds since system boot and it should be accurate to a few microseconds.
    last_tick: any;

    update_state(){
        /*Incremental encoders often output signals on two channels – typically termed “A” and “B” – 
        offset by 90 degrees (in quadrature). The direction of rotation can be determined by 
        which channel is leading. Generally, if channel A is leading, the direction is taken to be clockwise,
        and if channel B is leading, the direction is counterclockwise.*/
        if(this.last_tick['A'] && this.last_tick['B']){
            let delta_time = (this.last_tick['A'].tick >> 0) - (this.last_tick['B'].tick >> 0);
            let clockwise: boolean;
            if(delta_time>0){
                //First B flag then A flag
                clockwise = (this.last_tick['A'].level != this.last_tick['B'].level)
            } else {
                //First A flag then B flag
                clockwise = (this.last_tick['A'].level == this.last_tick['B'].level)
            }
            let elapsed_seconds = Math.abs(delta_time)/10e6
            let new_speed = (Math.PI/2)/this.motor_reduction/elapsed_seconds;
            if(!clockwise) new_speed = -new_speed;
            let mean_speed = (new_speed+this.speed)/2;
            this.position += mean_speed * elapsed_seconds;
            this.acceleration = (new_speed-this.speed)/ elapsed_seconds;


        }
    }

    encoder_alert(encoder: string){
        return ((level: number, tick: number)=>{
            this.last_tick[encoder] = {
                level: level,
                tick: tick,                
            }
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
        //Pin Configuration
        this.motor_power_pin = new Gpio(this.parameters.pins.M, { mode: Gpio.OUTPUT });
        this.motor_power_pin.pwmFrequency(1024);
        this.encoder_A_pin = new Gpio(this.parameters.pins.E1, { mode: Gpio.INPUT });
        this.encoder_B_pin = new Gpio(this.parameters.pins.E2, { mode: Gpio.INPUT });
        this.h_bridge_pin = new Gpio(this.parameters.pins.H, { mode: Gpio.OUTPUT });
        this.encoder_A_pin.enableAlert()
        this.encoder_B_pin.enableAlert()
        let startTick: number;

        // Use alerts to determine how long the LED was turned on
        this.encoder_A_pin.on('alert', this.encoder_alert('A'));
        this.encoder_B_pin.on('alert', this.encoder_alert('B'))



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
                if (this.is_simulation) {
                    console.log(output);
                    this.speed = this.speed_reference * 0.9;
                } else {
                    this.h_bridge_pin.digitalWrite(output > 0 ? 1 : 0)
                    this.motor_power_pin.pwmWrite(output)
                }
            }, 100);
        });
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