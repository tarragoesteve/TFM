# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
import math
import numpy
import scipy
from scipy import optimize, integrate
from robot import Robot
from tqdm import tqdm
from enum import Enum
from PID import PID


class Experiment(Enum):
    Horizontal = 1
    Waitress = 2
    Free = 3


experiment = Experiment.Free
transition_time = 0

my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w_N(.086, .10, .04, 2)

flywheel_controller = PID(0.5, 0.3, 0.05)
platform_controller = PID(0.5, 0.3, 0.05)


def nearestMultiple(target_angle, current_angle):
    return target_angle + round((current_angle - target_angle)/(2*math.pi))*2*math.pi


def external_torque(robot, t, q, dot_q, ddot_q):
    global transition_time
    if t < transition_time:
        # We are accelerating
        flywheel_signal = flywheel_controller.control_variable(
            -math.pi/2 - (q[0]+q[1]+q[2]), t)
    else:
        # We are breaking
        flywheel_signal = flywheel_controller.control_variable(
            +math.pi/2 - (q[0]+q[1]+q[2]), t)

    if experiment == Experiment.Horizontal:
        wheel_signal = +flywheel_signal

    elif experiment == Experiment.Free:
        if t < transition_time:
            wheel_signal = -2*robot.max_torque(0)
        else:
            wheel_signal = +2*robot.max_torque(0)

    elif experiment == Experiment.Waitress:
        forward_acceleration = ddot_q[0] * my_robot.r_wheel
        desired_angle = math.atan2(forward_acceleration, -my_robot.g)
        wheel_signal = platform_controller.control_variable(
            desired_angle-(q[0]+q[1]), t)

    if(dot_q[2] > 0):
        flywheel_signal = max(min(my_robot.max_torque(
            dot_q[2]), flywheel_signal), -robot.max_torque(0))
    else:
        flywheel_signal = max(min(robot.max_torque(
            0), flywheel_signal), -robot.max_torque(-dot_q[1]))

    if experiment == Experiment.Horizontal:
        wheel_signal = +flywheel_signal

    if (dot_q[1] > 0):
        # wheel signal belongs to (-2*robot.max_torque(0),2*robot.max_torque(dot_q[1]))
        wheel_signal = max(
            min(2*my_robot.max_torque(dot_q[1]), wheel_signal), -2*robot.max_torque(0))
    else:
        # wheel signal belongs to (-2*robot.max_torque(-dot_q[1]),2*robot.max_torque(0))
        wheel_signal = max(
            min(2*robot.max_torque(0), wheel_signal), -2*robot.max_torque(-dot_q[1]))
    
    if experiment == Experiment.Horizontal:
        flywheel_signal = +wheel_signal

    return [0, wheel_signal, flywheel_signal]


previous_q_ddot = [0, 0, 0]


def system_function(robot: Robot):
    M = numpy.matrix([[robot.I_wheel()+robot.I_platform() + robot.I_flywheel(robot.r_min()) + robot.m_total() * robot.r_wheel**2,
                       robot.I_platform() + robot.I_flywheel(robot.r_min()),
                       robot.I_flywheel(robot.r_min())],
                      [robot.I_platform() + robot.I_flywheel(robot.r_min()),
                       robot.I_platform() + robot.I_flywheel(robot.r_min()),
                       robot.I_flywheel(robot.r_min())],
                      [robot.I_flywheel(robot.r_min()),
                       robot.I_flywheel(robot.r_min()),
                       robot.I_flywheel(robot.r_min())]
                      ])

    a = robot.m_cylinder() * (robot.r_min()-robot.r_max()) * robot.g

    def aux_function(t, x):
        global previous_q_ddot
        q = x[0:3]
        q_dot = x[3:6]
        phi_ground_flywheel = q[0]+q[1]+q[2]
        aux = (a * math.sin(phi_ground_flywheel)
               * numpy.ones(3) + external_torque(robot, t, q, q_dot, previous_q_ddot))
        q_ddot = numpy.matmul(numpy.linalg.inv(M), numpy.transpose(aux))
        q_ddot = numpy.transpose(q_ddot)
        previous_q_ddot = q_ddot
        return [q_dot[0], q_dot[1], q_dot[2], q_ddot[0], q_ddot[1], q_ddot[2]]
    return lambda t, x: aux_function(t, x)


results = []
num_divisions = 1
total_time = 6
time_divisions = numpy.linspace(0, total_time, num_divisions)
for tt in tqdm(time_divisions):
    transition_time = 3
    initial_contition = [0, 0, 0, 0, 0, 0]
    ode_int = scipy.integrate.solve_ivp(
        system_function(my_robot),
        (0, total_time),
        initial_contition,
        max_step=0.001,
        method='RK45',
        dense_output=False)
    results.append(ode_int)

max_index = 0
plt.figure()
plt.title('Experiment: ' + experiment.name)
plt.xlabel('t [s]')
plt.ylabel('theta [rad]')
plt.plot(results[max_index].t, results[max_index].y[0])
plt.plot(results[max_index].t, results[max_index].y[1])
plt.plot(results[max_index].t, results[max_index].y[2])
plt.plot(results[max_index].t, results[max_index].y[0]+results[max_index].y[1])
plt.plot(results[max_index].t, results[max_index].y[0] +
         results[max_index].y[1]+results[max_index].y[2])
plt.legend(['q[0]', 'q[1]', 'q[2]', 'ground-platform', 'ground-flywheel'])


plt.figure()
plt.title('Experiment: ' + experiment.name)
plt.xlabel('t [s]')
plt.ylabel('theta dot [rad/s]')
plt.plot(results[max_index].t, results[max_index].y[3])
plt.plot(results[max_index].t, results[max_index].y[4])
plt.plot(results[max_index].t, results[max_index].y[5])
plt.plot(results[max_index].t, results[max_index].y[3]+results[max_index].y[4])
plt.plot(results[max_index].t, results[max_index].y[3] +
         results[max_index].y[4]+results[max_index].y[5])
plt.legend(['dot_q[0]', 'dot_q[1]', 'dot_q[2]',
            'ground-platform', 'ground-flywheel'])

plt.show()
