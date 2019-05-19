import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Selected_Motor } from '../app-logic.service';

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
  showXAxisLabel = true;
  xAxisLabel = 'Number';
  showYAxisLabel = true;
  yAxisLabel = 'Color Value';
  timeline = true;

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  multi: any[] = [
    {
      name: 'Cyan',
      series: [
        {
          name: 5,
          value: 2650
        },
        {
          name: 10,
          value: 2800      },
        {
          name: 15,
          value: 2000
        }
      ]
    },
    {
      name: 'Yellow',
      series: [
        {
          name: 5,
          value: 2500
        },
        {
          name: 10,
          value: 3100
        },
        {
          name: 15,
          value: 2350
        }
      ]
    }
  ];

  ngOnInit(){

  }
}
