# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import math
import numpy
import scipy
from scipy import optimize, integrate
from robot import Robot

#experiment = "Maximum equal torque"
#experiment = "PID 90º"
experiment = "Only flywheel torque"
#experiment = "No torque"


accumulated_error = 0
previous_error = 0
previous_error_time = 0
first_error = True
kp = +0.1
ki = 0.1
kd = 0.01


def PID(error, time):
    global accumulated_error
    global previous_error
    global previous_error_time
    global first_error
    global kp
    global ki
    global kd

    if first_error:
        first_error = False
        previous_error = error
        previous_error_time = time
        return kp * error
    else:
        if time - previous_error_time > 0:
            accumulated_error = accumulated_error + \
                error * (time - previous_error_time)
            output = kp * error + ki * accumulated_error + kd * \
                (error - previous_error) / (time - previous_error_time)
        else:
            output = kp * error + ki * accumulated_error
        previous_error = error
        previous_error_time = time
        return output


def external_torque(robot, t, q, dot_q):
    if experiment == "Maximum equal torque":
        tau = max(
            0, min(2*robot.max_torque(dot_q[1]), robot.max_torque(dot_q[2])))
        return [0, tau, tau,0]
    elif (experiment == "PID 90º"):
        output = PID((math.pi/2) - (q[0]+q[1]+q[2]), t)
        tau = min(output, robot.max_torque(
            dot_q[1]), robot.max_torque(dot_q[2]))
        return [0, tau, tau,0]
    elif (experiment == "Only flywheel torque"):
        return [0, 0, max(0, robot.max_torque(dot_q[2])),0]
    else:
        return [0, 0, 0,0]


def system_function(robot: Robot):
    def aux_function(t, x):
        q = x[0:4]
        q_dot = x[4:8]
        r = q[3]
        dot_r = q_dot[3]
        M = numpy.array([[robot.I_wheel()+robot.I_platform() + robot.I_flywheel(r) + robot.m_total() * robot.r_wheel**2,
                           robot.I_platform() + robot.I_flywheel(r),
                           robot.I_flywheel(r),
                           0],
                          [robot.I_platform() + robot.I_flywheel(r),
                           robot.I_platform() + robot.I_flywheel(r),
                           robot.I_flywheel(r),
                           0],
                          [robot.I_flywheel(r),
                           robot.I_flywheel(r),
                           robot.I_flywheel(r),
                           0],
                          [0,
                           0,
                           0,
                           robot.m_cylinder()]
                          ])

        dot_M = numpy.array([[1, 1, 1, 0],
                              [1, 1, 1, 0],
                              [1, 1, 1, 0],
                              [0, 0, 0, 0]
                              ]) * 2*robot.m_cylinder()*r*dot_r

        phi_ground_flywheel = q[0]+q[1]+q[2]
        dot_phi_ground_flywheel = q_dot[0]+q_dot[1]+q_dot[2]
        a = robot.m_cylinder() * (r-robot.r_max()) * robot.g * math.sin(phi_ground_flywheel)
        b = robot.m_cylinder() * r * dot_phi_ground_flywheel**2 \
            - robot.m_cylinder()*robot.g*math.cos(phi_ground_flywheel)
        dLdq = numpy.transpose([a,a,a,b])
    
        F = numpy.transpose(external_torque(robot, t, q, q_dot))
        dot_Mq_dot = numpy.matmul(dot_M , numpy.transpose(q_dot))
        aux = dLdq + F - dot_Mq_dot
        q_ddot = numpy.matmul(numpy.linalg.inv(M), aux)
        q_ddot = numpy.transpose(q_ddot)
        if r == robot.r_min():
            if q_dot[3]<0:
                q_dot[3] = 0
                q_ddot[3] = 0
        if r == robot.r_max():
            if q_dot[3]>0:
                q_dot[3] = 0
                q_ddot[3] = 0

        return [q_dot[0], q_dot[1], q_dot[2], q_dot[3], q_ddot[0], q_ddot[1], q_ddot[2],  q_ddot[3]]
    return lambda t, x: aux_function(t, x)

def r_max_event(t, x):
    if (x[7]<=0):
        return -1
    return x[3] - my_robot.r_max()

def r_min_event(t, x):
    if (x[7]>=0):
        return 1
    return x[3] - my_robot.r_min()

r_max_event.terminal = True
r_max_event.direction = 1
r_min_event.terminal = True
r_min_event.direction = -1

bounce_percentage = 0.0 #totally inelastic

def next_initial(final_condition):
    if(abs(- bounce_percentage *final_condition[1])<0.001):
        final_condition[1] = 0
    return [min(max(final_condition[0],my_robot.r_min()),my_robot.r_max()), - bounce_percentage *final_condition[1],final_condition[2],final_condition[3]]


my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w_N(.086, .10, .04, 2)
initial_contition = [0, 0, 0, (my_robot.r_max()+my_robot.r_min())/2, 0, 0, 0, 0]
total_t= 10
accumulated_t=0.0
results = {}
while(accumulated_t<total_t):
    ode_int = scipy.integrate.solve_ivp(
        system_function(my_robot),
        (accumulated_t, total_t+.0001),
        initial_contition,
        max_step=0.001,
        method='RK45',
        dense_output=True,
        events=[r_max_event,r_min_event])
    initial_contition = next_initial([ode_int.y[0][-1],ode_int.y[1][-1],ode_int.y[2][-1],ode_int.y[3][-1]])
    accumulated_t = ode_int.t[-1]
    for key, value in ode_int:
        if(key in results.keys):
            results[key]= numpy.append(results[key], value)
        else:
            results[key] = value


plt.figure()
plt.title('Experiment: ' + experiment)
plt.xlabel('t [s]')
plt.ylabel('theta [rad]')
plt.plot(ode_int.t, ode_int.y[0])
plt.plot(ode_int.t, ode_int.y[1])
plt.plot(ode_int.t, ode_int.y[2])
plt.plot(ode_int.t, ode_int.y[0]+ode_int.y[1])
plt.plot(ode_int.t, ode_int.y[0]+ode_int.y[1]+ode_int.y[2])
plt.legend(['q[0]', 'q[1]', 'q[2]', 'ground-platform', 'ground-flywheel'])

plt.figure()
plt.title('Experiment: ' + experiment)
plt.xlabel('t [s]')
plt.ylabel('r [m]')
plt.plot(ode_int.t, ode_int.y[3])

plt.figure()
plt.title('Experiment: ' + experiment)
plt.xlabel('t [s]')
plt.ylabel('theta dot [rad/s]')
plt.plot(ode_int.t, ode_int.y[4])
plt.plot(ode_int.t, ode_int.y[5])
plt.plot(ode_int.t, ode_int.y[6])
plt.plot(ode_int.t, ode_int.y[4]+ode_int.y[5])
plt.plot(ode_int.t, ode_int.y[4]+ode_int.y[5]+ode_int.y[6])
plt.legend(['dot_q[0]', 'dot_q[1]', 'dot_q[2]',
            'ground-platform', 'ground-flywheel'])

plt.show()

# print(ode_int)
