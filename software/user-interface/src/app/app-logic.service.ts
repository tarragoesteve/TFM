import { Injectable } from '@angular/core';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';

@Injectable({
  providedIn: 'root'
})
export class AppLogicService {
  //State
  speed_left = 0;
  position_platform = 90;
  speed_right = 2;
  //Max speed
  max_speed = 3.6;

  constructor() { }

  onKeyPress(event) {
    switch (event.key) {
      case 't':
        this.speed_left += this.max_speed / 100;
        break;
      case 'g':
        this.speed_left = 0;
        break;
      case 'b':
        this.speed_left -= this.max_speed / 100;
        break;
      case 'y':
        this.position_platform++;
        break;
      case 'h':
        this.position_platform = 0;
        break;
      case 'n':
        this.position_platform--;
        break;
      case 'u':
        this.speed_right += this.max_speed / 100;
        break;
      case 'j':
        this.speed_right = 0;
        break;
      case 'm':
        this.speed_right -= this.max_speed / 100;
        break;
    }

  }
}


export enum Selected_Motor {
  Left = "left",
  Right = "right",
  Platfrom = "platform",
}