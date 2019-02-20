import configuration from './hardware_config.json'
import {Motor} from "./components/motor";
import { Component } from './component';


for(let component_configuration of configuration.components){

    console.log(component_configuration.name);
}