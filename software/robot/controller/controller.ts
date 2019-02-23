import configuration from './hardware_config.json'
import {Motor} from "./components/motor";
import { Component } from './component';

let components : Component[] = [];

function new_component(component_configuration:any): Component {
    if(component_configuration.class == 'Motor'){
        return new Motor(component_configuration.name);
    }
    //Add all the class of components
    return new Motor(component_configuration.name);
    console.log("Component class not supported");
}

/*Init all the components with the configuration parameters*/
for(let component_configuration of configuration.components){    
    components.push(new_component(component_configuration));
}


/*Start all components loop*/
for (let component of components){
    component.loop()
}