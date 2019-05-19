import { Component, HostListener } from '@angular/core';
import { WheelControllerComponent } from "./wheel-controller/wheel-controller.component";
import { AppLogicService } from "./app-logic.service"
import { helpers } from 'chart.js';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'user-interface';

  constructor(private appLogic: AppLogicService){}

  @HostListener('document:keypress', ['$event']) helper(event){
    this.appLogic.onKeyPress(event);    
  }
}
