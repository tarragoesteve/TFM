import { Component, OnInit, Input } from '@angular/core';
import { NgCircleProgressModule } from 'ng-circle-progress';

@Component({
  selector: 'app-wheel-controller',
  templateUrl: './wheel-controller.component.html',
  styleUrls: ['./wheel-controller.component.css']
})
export class WheelControllerComponent implements OnInit {

  percent = 35;
  circle : NgCircleProgressModule;
  color = "#AABB02";
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
