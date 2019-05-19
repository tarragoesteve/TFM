import { Injectable } from '@angular/core';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';

@Injectable({
  providedIn: 'root'
})
export class AppLogicService {
  //State
  speed_left_ref = 0;
  position_platform_ref = 0;
  speed_right_ref = 0;
  //Max speed
  max_speed = 3.6;

  constructor() { }

  onKeyPress(event) {
    switch (event.key) {
      case 't':
        this.speed_left_ref += this.max_speed / 100;
        break;
      case 'g':
        this.speed_left_ref = 0;
        break;
      case 'b':
        this.speed_left_ref -= this.max_speed / 100;
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
        this.speed_right_ref += this.max_speed / 100;
        break;
      case 'j':
        this.speed_right_ref = 0;
        break;
      case 'm':
        this.speed_right_ref -= this.max_speed / 100;
        break;
      case 'q':
        this.speed_right_ref = 0;
        this.speed_left_ref = 0;
        this.position_platform_ref = 0;
        break;
      case 'w':
        this.speed_right_ref += this.max_speed / 100;
        this.speed_left_ref += this.max_speed / 100;
        break;
      case 'a':
        this.speed_right_ref -= this.max_speed / 100;
        this.speed_left_ref += this.max_speed / 100;
        break;
      case 's':
        this.speed_right_ref -= this.max_speed / 100;
        this.speed_left_ref -= this.max_speed / 100;
        break;
      case 'd':
        this.speed_right_ref += this.max_speed / 100;
        this.speed_left_ref -= this.max_speed / 100;
        break;
    }

  }
}


export enum Selected_Motor {
  Left = "left",
  Right = "right",
  Platfrom = "platform",
}