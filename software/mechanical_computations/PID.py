class PID:
    accumulated_error = 0
    previous_error = 0
    previous_error_time = 0
    first_error = True
    kp = 0
    ki = 0
    kd = 0

    def __init__(self,kp,ki,kd):
        self.kd = kd
        self.ki = ki
        self.kd = kd       
        pass

    def control_variable(self, error, time):
        if self.first_error:
            self.first_error = False
            self.previous_error = error
            self.previous_error_time = time
            return kp * error
        else:
            if time - self.previous_error_time > 0:
                self.accumulated_error = self.accumulated_error + \
                    error * (time - self.previous_error_time)
                output = self.kp * error + self.ki * self.accumulated_error + self.kd * \
                    (error - self.previous_error) / (time - self.previous_error_time)
            else:
                output = self.kp * error + self.ki * self.accumulated_error
            self.previous_error = error
            self.previous_error_time = time
            return output