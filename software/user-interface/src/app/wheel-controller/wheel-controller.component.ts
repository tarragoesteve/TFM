import { Component, OnInit, Input } from '@angular/core';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { Selected_Motor, AppLogicService } from "../app-logic.service";

@Component({
  selector: 'app-wheel-controller',
  templateUrl: './wheel-controller.component.html',
  styleUrls: ['./wheel-controller.component.css']
})
export class WheelControllerComponent implements OnInit {

  circle: NgCircleProgressModule;
  color = "#AABB02";
  @Input() selected: Selected_Motor;

  constructor(private appLogic: AppLogicService) { }

  ngOnInit() {
  }

  getPercentage() {
    switch (this.selected) {
      case Selected_Motor.Left:
        return Math.abs(100*this.appLogic.speed_left_ref/this.appLogic.max_speed);
      case Selected_Motor.Right:
        return Math.abs(100*this.appLogic.speed_right_ref/this.appLogic.max_speed);
      case Selected_Motor.Platfrom:
        return Math.abs(100*this.appLogic.position_platform_ref/360);
      default:
        break;
    }
  }

  clockwise(){
    switch (this.selected) {
      case Selected_Motor.Left:
        return this.appLogic.speed_left_ref>0;
      case Selected_Motor.Right:
        return this.appLogic.speed_right_ref>0;
      case Selected_Motor.Platfrom:
        return this.appLogic.position_platform_ref>0;
      default:
        break;
    }

  }




}
