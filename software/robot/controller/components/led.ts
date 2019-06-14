import { Component } from "../component";
import { Gpio } from "pigpio";

export class LED extends Component {
    led: Gpio;
    dutyCycle = 0;


    constructor(name: string, planner_uri: string, is_simulation: boolean, parameters: any) {
        super(name, planner_uri, is_simulation, parameters);     
        this.led = new Gpio(this.parameters.PIN, {mode: Gpio.OUTPUT});  
    }

    loop(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                this.led.pwmWrite(this.dutyCycle);
               
                this.dutyCycle += 5;
                if (this.dutyCycle > 255) {
                  this.dutyCycle = 0;
                }
              }, 20);
        });
    }
}