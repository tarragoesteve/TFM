# -*- coding: utf-8 -*-
"""g_optimization.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https://colab.research.google.com/drive/1ebH4_Hj2KYF5luWVoAeeWrA0N6QCFBj9
"""

import math
import numpy
from robot import Robot 

my_robot = Robot()
resolution = 100


r_flywheel_array=numpy.linspace(0.00,my_robot.r_external,resolution)
max_sin_pendulum_array = []
max_sin_flywheel_array = []
m_total_array = []
w_array = []
r_wheel_array = []
height_array = []
speed_horizontal_flywheel_array = []
speed_horizontal_pendulum_array = []



from tqdm import tqdm
for r_f in tqdm(r_flywheel_array):
  aux_sin_pendulum = 0
  aux_sin_flywheel = 0
  aux_m_total = 0
  aux_w = 0
  aux_r_wheel = 0 
  aux_height = 0
  aux_speed_horizontal_flywheel = 0
  aux_speed_horizontal_pendulum = 0
  for w in numpy.linspace(0.0, 2*my_robot.r_external - 0.3, resolution):
    for r_w in numpy.linspace(r_f, my_robot.r_external, resolution):
      my_robot.set_r_flywheel_r_wheel_w(r_f,r_w,w)
      if (my_robot.max_sin_pendulum()>aux_sin_pendulum):
        aux_sin_pendulum = my_robot.max_sin_pendulum()/my_robot.m_total()
        aux_sin_flywheel = my_robot.max_sin_flywheel()
        aux_m_total = my_robot.m_total()
        aux_w = w
        aux_r_wheel = r_w
        aux_height = my_robot.max_height_flywheel()
        aux_speed_horizontal_flywheel = my_robot.max_speed_horizontal_flywheel()
        aux_speed_horizontal_pendulum = my_robot.max_speed_horizontal_pendulum()

    
  max_sin_pendulum_array = numpy.append(max_sin_pendulum_array,aux_sin_pendulum)
  max_sin_flywheel_array = numpy.append(max_sin_flywheel_array,aux_sin_flywheel)
  m_total_array = numpy.append(m_total_array, aux_m_total)
  w_array = numpy.append(w_array, aux_w)
  r_wheel_array = numpy.append(r_wheel_array, aux_r_wheel)
  height_array = numpy.append(height_array, aux_height)
  speed_horizontal_flywheel_array = numpy.append(speed_horizontal_flywheel_array, aux_speed_horizontal_flywheel)
  speed_horizontal_pendulum_array = numpy.append(speed_horizontal_pendulum_array, aux_speed_horizontal_pendulum)


import matplotlib.pyplot as plt
plt.figure()
plt.title('max_sin_pendulum,max_sin_flywheel vs flywheel radius')
plt.xlabel('r flywheel [m]')
plt.ylabel('sin(alpha)')
plt.plot(r_flywheel_array,max_sin_pendulum_array)
plt.plot(r_flywheel_array,max_sin_flywheel_array)
plt.legend(['max_sin_pendulum','max_sin_flywheel','m_total'])

plt.figure()
plt.title('total mass vs flywheel radius')
plt.xlabel('r flywheel [m]')
plt.ylabel('mass [kg]')
plt.plot(r_flywheel_array,m_total_array)
plt.legend(['m_total'])

plt.figure()
plt.title('wheel radius vs flywheel radius')
plt.xlabel('r flywheel [m]')
plt.ylabel('[m]')
plt.plot(r_flywheel_array,r_wheel_array)
plt.plot(r_flywheel_array,w_array)
plt.legend(['r wheel','w'])


plt.figure()
plt.title('height obtained vs flywheel radius')
plt.xlabel('r flywheel [m]')
plt.ylabel('height [m]')
plt.plot(r_flywheel_array,height_array)
plt.legend(['height'])

plt.figure()
plt.title('speed flywheel, speed pendulum vs flywheel radius')
plt.xlabel('r flywheel [m]')
plt.ylabel('speed [m/s]')
plt.plot(r_flywheel_array,speed_horizontal_pendulum_array)
plt.plot(r_flywheel_array,speed_horizontal_flywheel_array)
plt.legend(['pendulum','flywheel'])

plt.show()