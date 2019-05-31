import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WheelControllerComponent } from './wheel-controller/wheel-controller.component';


const routes: Routes = [
  {path: '*', component: WheelControllerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }