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
    Compose = 4


experiment = Experiment.Horizontal

time_to_stop = {
    Experiment.Horizontal: 1,
    Experiment.Waitress: 1,
    Experiment.Free: 1,
    Experiment.Compose: 1,
}

integration_time = 1
if experiment == Experiment.Waitress:
    integration_time = 0.05
waitress_angle = 0


my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w_N(.086, .10, .04, 2)

flywheel_controller = PID(0.5, 0.3, 0.05)
platform_controller = PID(0.1, 0, 0)

def external_torque(robot, t, q, dot_q, ddot_q):
    if experiment == Experiment.Horizontal:
        if t < time_to_stop[experiment]:
            flywheel_signal = flywheel_controller.control_variable(
            -math.pi/2 - (q[0]+q[1]+q[2]), t)
        else:
            flywheel_signal = flywheel_controller.control_variable(
                +math.pi/2 - (q[0]+q[1]+q[2]), t)
        wheel_signal = +flywheel_signal

    elif experiment == Experiment.Free:
        # We want q2 to be 0
        flywheel_signal = flywheel_controller.control_variable(
            -q[2], t)
        if t < time_to_stop[experiment]:
            wheel_signal = -2*robot.max_torque(0)
        else:
            wheel_signal = +2*robot.max_torque(0)

    elif experiment == Experiment.Waitress:
        if t < time_to_stop[experiment]:
            flywheel_signal = flywheel_controller.control_variable(
            -math.pi/2 - (q[0]+q[1]+q[2]), t)
        else:
            flywheel_signal = flywheel_controller.control_variable(
                +math.pi/2 - (q[0]+q[1]+q[2]), t)
        wheel_signal = +flywheel_signal
        platform_signal = platform_controller.control_variable(
            waitress_angle-(q[0]+q[1]), t)
        wheel_signal = platform_signal + flywheel_signal

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
q_ddot_hist = []
t_hist = []


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

    desired_angle = 0
    a = robot.m_cylinder() * (robot.r_min()-robot.r_max()) * robot.g

    def aux_function(t, x):
        q = x[0:3]
        q_dot = x[3:6]
        phi_ground_flywheel = q[0]+q[1]+q[2]
        aux = (a * math.sin(phi_ground_flywheel)
               * numpy.ones(3) + external_torque(robot, t, q, q_dot, previous_q_ddot))
        q_ddot = numpy.matmul(numpy.linalg.inv(M), numpy.transpose(aux))
        q_ddot = numpy.transpose(q_ddot)
        return [q_dot[0], q_dot[1], q_dot[2], q_ddot[0], q_ddot[1], q_ddot[2]]
    return lambda t, x: aux_function(t, x)



def stop_event(t, x):
    return x[3]

stop_event.terminal = True
stop_event.direction = -1

results = []

initial_contition = [0, 0, 0, 0, 0, 0]
stopped = False
start_time = 0
end_time = integration_time
while not stopped:
    ode_int = scipy.integrate.solve_ivp(
        system_function(my_robot),
        (start_time, end_time),
        initial_contition,
        max_step=0.001,
        method='RK45',
        dense_output=False,
        events=[stop_event])
    results.append(ode_int)
    if ode_int.status == 1:
        stopped = True
    else:
        start_time = end_time
        end_time = start_time + integration_time
        initial_contition = [y[-1] for y in ode_int.y]

result = [y for x in []]

plt.figure()
plt.title('Experiment: ' + experiment.name)
plt.xlabel('t [s]')
plt.ylabel('theta [rad]')
plt.plot( [y for x in [result.t for result in results] for y in x],
         [y for x in [result.y[0] for result in results] for y in x])
plt.plot( [y for x in [result.t for result in results] for y in x],
         [y for x in [result.y[1] for result in results] for y in x])
plt.plot( [y for x in [result.t for result in results] for y in x],
         [y for x in [result.y[2] for result in results] for y in x])
plt.plot( [y for x in [result.t for result in results] for y in x],
         [y for x in [result.y[2] for result in results] for y in x])
# plt.plot(results[max_index].t, results[max_index].y[1])
# plt.plot(results[max_index].t, results[max_index].y[2])
# plt.plot(results[max_index].t, results[max_index].y[0]+results[max_index].y[1])
# plt.plot(results[max_index].t, results[max_index].y[0] +
#         results[max_index].y[1]+results[max_index].y[2])
# plt.plot(t_hist, [float(q_ddot[0]) for q_ddot in q_ddot_hist ])
# plt.plot(t_hist, [math.atan2(float(q_ddot[0])* my_robot.r_wheel,my_robot.g) for q_ddot in q_ddot_hist ])

plt.legend(['q[0]', 'q[1]', 'q[2]', 'ground-platform',
           'ground-flywheel', 'angle'])


# plt.figure()
plt.title('Experiment: ' + experiment.name)
plt.xlabel('t [s]')
plt.ylabel('theta dot [rad/s]')
# plt.plot(results[max_index].t, results[max_index].y[3])
# plt.plot(results[max_index].t, results[max_index].y[4])
# plt.plot(results[max_index].t, results[max_index].y[5])
# plt.plot(results[max_index].t, results[max_index].y[3]+results[max_index].y[4])
# plt.plot(results[max_index].t, results[max_index].y[3] +
#         results[max_index].y[4]+results[max_index].y[5])
# plt.legend(['dot_q[0]', 'dot_q[1]', 'dot_q[2]',
#            'ground-platform', 'ground-flywheel'])

plt.show()
