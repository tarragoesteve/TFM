import { Component } from "../component";
import { Gpio } from "pigpio";
import * as i2c from "i2c-bus";
let MPU6050 = require('i2c-mpu6050');


export class Accelerometer extends Component {
    static readonly MPU_ADDR = 0x68;
    static readonly ACCEL_X = 0x38B;
    sensor: any;

    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);
        //Initialize variables to 0
        var i2c1 = i2c.openSync(1); 
        this.sensor = new MPU6050(i2c1, Accelerometer.MPU_ADDR);
    }

    loop(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                let data = this.sensor.readSync();
                console.log(data);
                //Send state to the planner
                this.socket.emit('state', {
                    "component": this.name, "data": data
                })

            }, 500);
        });
    }
}