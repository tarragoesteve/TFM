"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var hardware_config_json_1 = __importDefault(require("./hardware_config.json"));
var motor_1 = require("./components/motor");
var components = [];
function new_component(component_configuration, general_configuration) {
    if (component_configuration.class == 'Motor') {
        return new motor_1.Motor(component_configuration.name, general_configuration.planner_uri, general_configuration.is_simulation, component_configuration.parameters);
    }
    //Add all the class of components
    console.log("Component class not supported");
    return new motor_1.Motor(component_configuration.name, general_configuration.planner_uri, general_configuration.is_simulation, component_configuration.parameters);
}
/*Init all the components with the configuration parameters*/
for (var _i = 0, _a = hardware_config_json_1.default.components; _i < _a.length; _i++) {
    var component_configuration = _a[_i];
    components.push(new_component(component_configuration, hardware_config_json_1.default));
}
/*Start all components loop*/
for (var _b = 0, components_1 = components; _b < components_1.length; _b++) {
    var component = components_1[_b];
    component.loop();
}
