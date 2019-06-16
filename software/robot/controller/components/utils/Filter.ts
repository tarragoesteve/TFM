export class Filter {
    data : number [] = [];
    size : number = 1;
    mean = 0;

    constructor(size: number) {
        this.size = size;
    }

    addSample(sample: number): number {
        this.data.push(sample);
        this.mean += sample/this.size;
        let out: any = 0;
        if(this.data.length>this.size){
            out = this.data.shift();
            this.mean -= out/this.size;
        }
        return this.mean;
    }
}