import configuration from './hardware_config.json'



let components = []

for(let component of configuration.components){
    console.log(component.name);
}