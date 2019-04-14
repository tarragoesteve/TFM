# -*- coding: utf-8 -*-

import math
import numpy
import scipy
from scipy import optimize, integrate


from robot import Robot 

target_omega = Robot.motor_max_speed*0.6
def motor_torque(robot, t,omega, dot_omega):
    return max(-1,min(1,-1*math.cos(omega)+target_omega-dot_omega))*robot.max_torque(dot_omega)

def system_function(robot):
    def aux_function (t,x):
        if x[0] <= my_robot.r_min():
            #r = r_min
            return [max(0,x[1]), #r dot is at least 0, cannot be negative
            max(0,-robot.g * math.cos(x[2]) + x[0] * x[3]*x[3]), #idem
            x[3],
            (motor_torque(robot,t,x[2],x[3])+ robot.m_cylinder() * robot.g * (x[0] - robot.r_max()) * math.sin(x[2])) / robot.I_flywheel(x[0])
            ]
        if x[0] >= my_robot.r_max():
            #r = r_max
            return [min(0,x[1]),
            min(0,-robot.g * math.cos(x[2]) + x[0] * x[3]*x[3]),
            x[3],
            (motor_torque(robot,t,x[2],x[3])+ robot.m_cylinder() * robot.g * (x[0] - robot.r_max()) * math.sin(x[2])) / robot.I_flywheel(x[0])
            ]
        return [x[1],
        -robot.g * math.cos(x[2]) + x[0] * x[3]*x[3],
        x[3],
        (motor_torque(robot,t,x[2],x[3])+ robot.m_cylinder() * robot.g * (x[0] - robot.r_max()) * math.sin(x[2])) / robot.I_flywheel(x[0])
        ]
    return lambda t,x: aux_function(t,x)

my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w_N(.086,.10,.04,2)

system = system_function(my_robot)

def r_max_event(t, x):
    if (x[1]<=0):
        return -1
    return x[0] - my_robot.r_max()

def r_min_event(t, x):
    if (x[1]>=0):
        return 1
    return x[0] - my_robot.r_min()

r_max_event.terminal = True
r_max_event.direction = 1
r_min_event.terminal = True
r_min_event.direction = -1

bounce_percentage = 0.0 #totally inelastic

def next_initial(final_condition):
    if(abs(- bounce_percentage *final_condition[1])<0.001):
        final_condition[1] = 0
    return [min(max(final_condition[0],my_robot.r_min()),my_robot.r_max()), - bounce_percentage *final_condition[1],final_condition[2],final_condition[3]]

initial_contition = [my_robot.r_max(),0.0,math.pi,target_omega]
total_t= 10
accumulated_t=0.0
results = [initial_contition]
time_array = []
r_array = []
d_r_array = []
omega_array = []
d_omega_array = []

while(accumulated_t<total_t):
    ode_int = scipy.integrate.solve_ivp(system_function(my_robot), (accumulated_t,total_t+.0001), initial_contition,max_step=0.001, method='RK45',dense_output=True , events=[r_max_event,r_min_event])
    time_array = numpy.append(time_array,ode_int.t)
    r_array = numpy.append(r_array,ode_int.y[0])
    d_r_array = numpy.append(d_r_array,ode_int.y[1])
    omega_array = numpy.append(omega_array,ode_int.y[2])
    d_omega_array = numpy.append(d_omega_array,ode_int.y[3])

    initial_contition = next_initial([ode_int.y[0][-1],ode_int.y[1][-1],ode_int.y[2][-1],ode_int.y[3][-1]])
    accumulated_t = ode_int.t[-1]
    #print(accumulated_t)

import matplotlib.pyplot as plt
plt.figure()
plt.title('ODE')
plt.xlabel('t [s]')
plt.ylabel('r [m]')
plt.plot(time_array,r_array)

plt.figure()
plt.title('ODE')
plt.xlabel('t [s]')
plt.ylabel('theta dot [rad/s]')
plt.plot(time_array,d_omega_array)

plt.figure()
plt.title('ODE')
plt.xlabel('t [s]')
plt.ylabel('theta [rad]')
plt.plot(time_array,omega_array)

plt.figure()
plt.title('ODE')
plt.xlabel('theta [rad]')
plt.ylabel('r [m]')
plt.plot(omega_array,r_array)

torque_array = [motor_torque(my_robot,t,omega,dot_omega) for t,omega,dot_omega in zip(time_array,omega_array,d_omega_array)]
accumulated_torque = []
suma=0
for torque,time,p_time in zip(torque_array[1:],time_array[1:],time_array[:-1]):
    suma+=torque*(time-p_time)
    accumulated_torque.append(suma)
plt.figure()
plt.title('ODE')
plt.xlabel('t [s]')
plt.ylabel('tau motor [N*m]')
plt.plot(time_array,torque_array)
plt.plot(time_array[1:],accumulated_torque)
print(accumulated_torque[-1]/time_array[-1])


plt.show()
#print(ode_int)