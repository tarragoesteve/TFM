import configuration from './hardware_config.json'
import { Motor } from "./components/motor";
import { Stub } from "./components/stub";
import { Component } from './component';
import { LED } from "./components/led";
import { SimpleMotor } from "./components/simple_motor";
import { Stabilizer } from "./components/stabilizer";


let components: Component[] = [];

function new_component(component_configuration: any, general_configuration: any): Component {
    if (component_configuration.class == 'Motor') {
        return new Motor(component_configuration.name,
            general_configuration.planner_uri,
            general_configuration.is_simulation,
            component_configuration.parameters);
    }
    if (component_configuration.class == 'Stub') {
        return new Stub(component_configuration.name,
            general_configuration.planner_uri,
            general_configuration.is_simulation,
            component_configuration.parameters);
    }
    if (component_configuration.class == 'LED') {
        return new LED(component_configuration.name,
            general_configuration.planner_uri,
            general_configuration.is_simulation,
            component_configuration.parameters);
    }
    if (component_configuration.class == 'SimpleMotor') {
        return new SimpleMotor(component_configuration.name,
            general_configuration.planner_uri,
            general_configuration.is_simulation,
            component_configuration.parameters);
    }
    if (component_configuration.class == 'Stabilizer') {
        return new Stabilizer(component_configuration.name,
            general_configuration.planner_uri,
            general_configuration.is_simulation,
            component_configuration.parameters);
    }
    
    //Add all the class of components
    console.log("Component class not supported");
    return new Stub(component_configuration.name,
        general_configuration.planner_uri,
        general_configuration.is_simulation,
        component_configuration.parameters);
}

/*Init all the components with the configuration parameters*/
for (let component_configuration of configuration.components) {
    components.push(new_component(component_configuration, configuration));
}


/*Start all components loop*/
for (let component of components) {
    component.loop()
}