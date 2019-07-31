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
  //xScaleMin = 1
  //xScaleMax = 5

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
  appLogic : AppLogicService;

  constructor(appLogic: AppLogicService){
    this.appLogic = appLogic;
  }

  ngOnInit() {

    setInterval(() => {
      let aux = []
      for(let item of this.appLogic.history[this.selected])
      {
        console.log(item);
        
        if(Date.now()-item.time<10*1000){
          aux.push({
            name: item.time,
            value: item.speed
          })
        }
      }

      console.log(aux);
      

      this.multi[0]['series'] = aux;
      
      this.multi = [...this.multi]
    }, 1000)
  }
}
