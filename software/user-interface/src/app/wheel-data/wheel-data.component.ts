import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Selected_Motor, AppLogicService, ReferenceParameter } from "../app-logic.service";

@Component({
  selector: 'app-wheel-data',
  templateUrl: './wheel-data.component.html',
  styleUrls: ['./wheel-data.component.css']
})
export class WheelDataComponent implements OnInit {
  @Input() selected: Selected_Motor;

  view: any[] = undefined;

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = false;
  xAxisLabel = 'Number';
  showYAxisLabel = false;
  yAxisLabel = 'Color Value';
  timeline = true;
  schemeType = 'ordinal'
  xScaleMin = 1
  xScaleMax = 5

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  multi: any[] = [
    {
      name: 'Speed',
      series: [
      ]
    },
  ];

  ngOnInit() {

    let time = 0;
    setInterval(() => {
      time = time +1;
      this.multi[0]['series'].push({
        name: time,
        value: Math.random()*5
      })
      this.multi = [...this.multi]
      console.log(this.multi[0]['series']);
      
      this.xScaleMin = this.multi[0]['series'][this.multi[0]['series'].length-1].name-5; 
      this.xScaleMax = this.multi[0]['series'][this.multi[0]['series'].length-1].name;
     
    }, 1000)
  }
}
