import { Component, OnInit, Input } from '@angular/core';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { Selected_Motor, AppLogicService, ReferenceParameter } from "../app-logic.service";

@Component({
  selector: 'app-wheel-controller',
  templateUrl: './wheel-controller.component.html',
  styleUrls: ['./wheel-controller.component.css']
})
export class WheelControllerComponent implements OnInit {

  circle: NgCircleProgressModule;
  color = "#AABB02";
  @Input() selected: Selected_Motor;
  modes = [ReferenceParameter[ReferenceParameter.PWM]];
  selected_mode = ReferenceParameter[ReferenceParameter.PWM];
  

  constructor(private appLogic: AppLogicService) { }

  ngOnInit() {
    switch (this.selected) {
      case Selected_Motor.Platform:
        this.modes = [ReferenceParameter[ReferenceParameter.PWM],ReferenceParameter[ReferenceParameter.position],
              ReferenceParameter[ReferenceParameter.speed],ReferenceParameter[ReferenceParameter.inclination]]
        break
      default:
          this.modes = [ReferenceParameter[ReferenceParameter.PWM],ReferenceParameter[ReferenceParameter.position],
          ReferenceParameter[ReferenceParameter.speed]]
          break;
    }
  }

  getPercentage() {
    this.appLogic.modes[this.selected] = this.selected_mode;
    return Math.abs(100 * this.appLogic.references[this.selected]);
  }

  clockwise() {
      return this.appLogic.references[this.selected] > 0;
  }


}
