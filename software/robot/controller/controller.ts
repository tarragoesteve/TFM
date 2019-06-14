
import configuration from './hardware_config_single_motor.json'
import { Motor } from "./components/motor";
import { Stub } from "./components/stub";
import { Component } from './component';
import { LED } from "./components/led";

let components: Component[] = [];

function new_component(component_configuration: any, general_configuration: any): Component {
    if (false && component_configuration.class == 'Motor') {
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