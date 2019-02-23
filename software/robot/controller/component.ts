export abstract class Component {

    name: String;


    constructor(name: String) {
        this.name = name;
    }

    loop(): Promise<boolean>
    {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(this.name);
                this.loop();                
            }, 2000);
          });
    }
}