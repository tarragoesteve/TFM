import { Injectable } from '@angular/core';
import * as socketio from "socket.io-client";


export enum ReferenceParameter {
  position,
  speed,
  acceleration,
  PWM,
  inclination,
}

export enum Selected_Motor {
  Left = "left_motor",
  Right = "right_motor",
  Platform = "platform_motor",
}

@Injectable({
  providedIn: 'root'
})
export class AppLogicService {
  //State
  socket: any;
  references = {
    left_motor: 0,
    right_motor: 0,
    platform_motor: 0,
  };
  modes = {
    left_motor: "PWM",
    right_motor: "PWM",
    platform_motor: "PWM",
  };

  history: any = {};

  gamepads : any = {};

  sendInput() {
    let input = {};
    input["left_motor"] = {}
    input["right_motor"] = {}
    input["platform_motor"] = {}

    for (let motor of ["left_motor", "right_motor", "platform_motor"]) {
      input[motor][this.modes[motor] + "_reference"] = this.references[motor]
    }
    this.socket.emit('input', input)
  }

  constructor() {
    //TODO: Change localhost
    this.socket = socketio.connect('http://185.181.8.64:3000/' + '?name=user_interface');
    this.history["left_motor"] = []
    this.history["right_motor"] = []
    this.history["platform_motor"] = []
    this.socket.on('state', (msg: any) => {
      if (msg.motor) {
        this.history[msg.motor].push(msg)
      }
      //console.log(msg);
    })

    console.log('Constructed');
    

    window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
      this.gamepads[e.gamepad.index] = e.gamepad
      console.log('Gamepad connected!');
    });

    window.addEventListener("gamepaddisconnected",(e: GamepadEvent) => {
      delete this.gamepads[e.gamepad.index]
      console.log('Gamepad disconnected!');
    });

    setInterval(()=>{
      if (Object.keys(this.gamepads).length > 0)
      {
        let gamepad = this.gamepads[Object.keys(this.gamepads)[0]]
        let gp = navigator.getGamepads()[gamepad.index];
        let x = gp.axes[0]
        let y = -gp.axes[1]    
        this.references.left_motor = -(x + y);
        this.references.right_motor = -x + y;
        if (Math.abs(this.references.left_motor)>1) {
          this.references.left_motor /= Math.abs(this.references.left_motor);
          this.references.right_motor /= Math.abs(this.references.left_motor);        
        }
        if (Math.abs(this.references.right_motor)>1) {
          this.references.left_motor /= Math.abs(this.references.right_motor);
          this.references.right_motor /= Math.abs(this.references.right_motor);        
        }
        this.sendInput()
      }
    },50)



  }

  onKeyPress(event) {
    switch (event.key) {
      case 't':
        this.references[Selected_Motor.Left] += 1 / 100;
        break;
      case 'g':
        this.references[Selected_Motor.Left] = 0;
        break;
      case 'b':
        this.references[Selected_Motor.Left] -= 1 / 100;
        break;
      case 'y':
        this.references[Selected_Motor.Platform] += 1 / 100;
        break;
      case 'h':
        this.references[Selected_Motor.Platform] = 0;
        break;
      case 'n':
        this.references[Selected_Motor.Platform] -= 1 / 100;
        break;
      case 'u':
        this.references[Selected_Motor.Right] += 1 / 100;
        break;
      case 'j':
        this.references[Selected_Motor.Right] = 0;
        break;
      case 'm':
        this.references[Selected_Motor.Right] -= 1 / 100;
        break;
      case 'q':
        this.references[Selected_Motor.Right] = 0.0;
        this.references[Selected_Motor.Left] = 0.0;
        this.references[Selected_Motor.Platform] = 0.0;
        break;
      case 'w':
        this.references[Selected_Motor.Right] += 1 / 100;
        this.references[Selected_Motor.Left] += 1 / 100;
        break;
      case 'a':
        this.references[Selected_Motor.Right] -= 1 / 100;
        this.references[Selected_Motor.Left] += 1 / 100;
        break;
      case 's':
        this.references[Selected_Motor.Right] -= 1 / 100;
        this.references[Selected_Motor.Left] -= 1 / 100;
        break;
      case 'd':
        this.references[Selected_Motor.Right] += 1 / 100;
        this.references[Selected_Motor.Left] -= 1 / 100;
        break;

      case '5':
        this.references[Selected_Motor.Right] += 1 / 100;
        this.references[Selected_Motor.Left] -= 1 / 100;
        break;

      case '1':
        this.references[Selected_Motor.Right] += 1 / 100;
        this.references[Selected_Motor.Left] += 1 / 100;
        break;

      case '3':
        this.references[Selected_Motor.Right] -= 1 / 100;
        this.references[Selected_Motor.Left] -= 1 / 100;
        break;

      case '2':
        this.references[Selected_Motor.Right] -= 1 / 100;
        this.references[Selected_Motor.Left] += 1 / 100;
        break;
    }
    this.sendInput()
  }
}


