# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import math
import numpy
import scipy
from scipy import optimize, integrate
from robot import Robot
from tqdm import tqdm

transition_time=0

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
            accumulated_error = accumulated_error + error * (time - previous_error_time)
            output = kp * error + ki * accumulated_error + kd * (error - previous_error) / (time - previous_error_time)
        else:
            output = kp * error + ki * accumulated_error
        previous_error = error
        previous_error_time = time
        return output


def external_torque(robot, t, q, dot_q):
    global transition_time
    if t< transition_time:
        output = PID( (math.pi/2) - (q[0]+q[1]+q[2]), t)
        tau = min(output, 2*robot.max_torque(dot_q[1]), robot.max_torque(dot_q[2]))
        return [0, tau, tau]
    else:
        tau = max(0,min(2*robot.max_torque(dot_q[1]), robot.max_torque(dot_q[2])))
        return [0, tau, tau]

def system_function(robot: Robot):
    M = numpy.matrix([[robot.I_wheel()+robot.I_platform() + robot.I_flywheel() + robot.m_total() * robot.r_wheel**2,
                       robot.I_platform() + robot.I_flywheel(),
                       robot.I_flywheel()],
                      [robot.I_platform() + robot.I_flywheel(),
                       robot.I_platform() + robot.I_flywheel(),
                       robot.I_flywheel()],
                      [robot.I_flywheel(),
                       robot.I_flywheel(),
                       robot.I_flywheel()]
                      ])

    a = robot.m_cylinder() * (robot.r_min()-robot.r_max()) * robot.g

    def aux_function(t, x):
        q = x[0:3]
        q_dot = x[3:6]
        phi_ground_flywheel = q[0]+q[1]+q[2]
        aux = (a * math.sin(phi_ground_flywheel)
               * numpy.ones(3) + external_torque(robot, t, q, q_dot))
        q_ddot = numpy.matmul(numpy.linalg.inv(M), numpy.transpose(aux))
        q_ddot = numpy.transpose(q_ddot)
        return [q_dot[0], q_dot[1], q_dot[2], q_ddot[0], q_ddot[1], q_ddot[2]]
    return lambda t, x: aux_function(t, x)


my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w_N(.086, .10, .04, 2)
initial_contition = [0,0,0,0,0,0]
results=[]
num_divisions = 100
total_time = 12
for tt in tqdm(numpy.linspace(0,total_time,num_divisions)):
    transition_time= tt
    ode_int = scipy.integrate.solve_ivp(
        system_function(my_robot),
        (0, total_time),
        initial_contition,
        max_step=0.001,
        method='RK45',
        dense_output=False)
    results.append(ode_int)


plt.figure()
plt.title('Experiment: ' + 'Changing transition time')
plt.xlabel('transition time [s]')
plt.ylabel('distance [m]')
distance = [-result.y[0][-1] * my_robot.r_wheel for result in results]
plt.plot(numpy.linspace(0,total_time,num_divisions), distance)
plt.legend(['q[0]'])

plt.show()
