import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WheelControllerComponent } from './wheel-controller/wheel-controller.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { MatGridListModule, MatRadioModule } from '@angular/material';
import { WheelDataComponent } from './wheel-data/wheel-data.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppLogicService } from "./app-logic.service";
import { FormsModule } from '@angular/forms';
import {RoundProgressModule} from 'angular-svg-round-progressbar';


@NgModule({
  declarations: [
    AppComponent,
    WheelControllerComponent,
    WheelDataComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatGridListModule,
    MatRadioModule,
    NgxChartsModule,
    RoundProgressModule,
    FormsModule,
    BrowserAnimationsModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: "#78C000",
      innerStrokeColor: "#C7E596",
      animationDuration: 300,
    })
  ],
  providers: [AppLogicService],
  bootstrap: [AppComponent]
})
export class AppModule { }
