import { Injectable } from '@angular/core';
import * as socketio from "socket.io-client";

import { SocketIOClient} from "socket.io-client";
@Injectable({
  providedIn: 'root'
})
export class AppLogicService {
  //State
  socket: SocketIOClient.Socket;
  speed_left_ref = 0;
  position_platform_ref = 0;
  speed_right_ref = 0;


  sendState() {
    this.socket.emit('input', {
      "user_interface": "user_interface",
      speed_left_ref: this.speed_left_ref,
      position_platform_ref: this.position_platform_ref,
      speed_right_ref: this.speed_right_ref
    })
  }

  constructor() {
    this.socket = socketio.connect('http://localhost:3000/' + '?name=user_interface')
  }

  onKeyPress(event) {
    switch (event.key) {
      case 't':
        this.speed_left_ref += 1 / 100;
        break;
      case 'g':
        this.speed_left_ref = 0;
        break;
      case 'b':
        this.speed_left_ref -= 1/ 100;
        break;
      case 'y':
        this.position_platform_ref++;
        break;
      case 'h':
        this.position_platform_ref = 0;
        break;
      case 'n':
        this.position_platform_ref--;
        break;
      case 'u':
        this.speed_right_ref += 1 / 100;
        break;
      case 'j':
        this.speed_right_ref = 0;
        break;
      case 'm':
        this.speed_right_ref -= 1 / 100;
        break;
      case 'q':
        this.speed_right_ref = 0.0;
        this.speed_left_ref = 0.0;
        this.position_platform_ref = 0.0;
        break;
      case 'w':
        this.speed_right_ref += 1 / 100;
        this.speed_left_ref += 1 / 100;
        break;
      case 'a':
        this.speed_right_ref -= 1 / 100;
        this.speed_left_ref += 1 / 100;
        break;
      case 's':
        this.speed_right_ref -= 1 / 100;
        this.speed_left_ref -= 1 / 100;
        break;
      case 'd':
        this.speed_right_ref += 1 / 100;
        this.speed_left_ref -= 1 / 100;
        break;
    }
    this.sendState()
  }
}


export enum Selected_Motor {
  Left = "left",
  Right = "right",
  Platform = "platform",
}
