//TODO PID class
export class PID {
    kp: number;
    ki: number;
    kd: number;

    first_error: boolean;
    accumulated_error: number;
    previous_error: number;
    previous_error_time: number;


    constructor(kp: number, ki: number, kd: number) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.first_error = true;
        this.previous_error = this.accumulated_error = 0.0;
        this.previous_error_time = Date.now();
    }

    output(error: number): number {
        if (this.first_error) {
            this.first_error = false;
            this.previous_error = error;
            this.previous_error_time = Date.now();
            return this.kp * error;
        } else {
            this.accumulated_error += error * (Date.now() - this.previous_error_time);
            let output: number = this.kp * error +
                this.ki * this.accumulated_error;
                //this.kd * (error - this.previous_error) / (Date.now() - this.previous_error_time);
            this.previous_error = error;
            this.previous_error_time = Date.now();
            return output;
        }
    }
}