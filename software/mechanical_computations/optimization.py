# -*- coding: utf-8 -*-
"""g_optimization.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https://colab.research.google.com/drive/1ebH4_Hj2KYF5luWVoAeeWrA0N6QCFBj9
"""

import math
import numpy

class Robot:
  r_flywheel = 0
  r_wheel = 0
  L_robot = 0
  w = 0
  valid_configuration=True
  
  m_battery = .2#.15
  m_motor = .175
  m_wheel = .1
  m_rest = 4 * m_battery + 4 * m_motor + 2 * m_wheel

  L_rest = 0.35
  r_external=0.59/2.0
  g = 9.81
  rho_flywheel=7850
  h=.01
  b=.005

  A_drag = .01
  rho = 1.2
  C_D = 1

  
  motor_max_speed = 19.0
  motor_max_torque = 5 * 9.8 / 100.0
  
  def __init__(self):
    pass
    
  def m_cylinder(self):
    return  self.w * (self.r_flywheel/3.0)**2 * self.rho_flywheel
  
  def m_flywheel(self):
    return 6 * self.m_cylinder()
  
  def I_flywheel(self, radius=0):
    if radius == 0:
      return 6 * self.m_cylinder() * (self.r_flywheel*2.0/3.0)**2
    else:
      return 5 * self.m_cylinder() * (self.r_flywheel*2.0/3.0)**2 + self.m_cylinder() * (radius)**2
    
  def m_total(self):
    return self.m_rest + self.m_flywheel() 
  
  def get_R(self):
    return self.I_flywheel()/((self.m_total()+self.m_wheel)*self.r_wheel**2)

  def get_L(self):
    return 0.4 + self.w
  
  def set_r_flywheel_r_wheel_w(self,r_flywheel,r_wheel,w):
    self.r_flywheel = r_flywheel
    self.r_wheel = r_wheel
    self.w = w
    if(self.r_wheel < math.sqrt((r_flywheel+self.b)**2+(self.h/2)**2) + 0.01):
      self.valid_configuration = False
    elif(self.r_external < math.sqrt(self.r_wheel**2+(self.get_L()/2)**2)):
      self.valid_configuration = False
    else:
      self.valid_configuration = True
    
  def max_speed_horizontal_flywheel(self):
    if(not self.valid_configuration):
      return 0
    return self.motor_max_speed * self.get_R() * self.r_wheel

  def max_speed_horizontal_pendulum(self):
    if(not self.valid_configuration):
      return 0
    return math.sqrt((2*self.m_cylinder() * self.g *(self.r_flywheel/3)* self.r_flywheel )/(self.rho * self.C_D * self.A_drag))

  def max_height_flywheel(self):
    if(not self.valid_configuration):
      return 0
    return self.motor_max_speed * self.max_speed_horizontal_flywheel() * self.I_flywheel() / (self.m_total() * self.g * self.r_flywheel)
  
  def max_acceleration_horizontal_flywheel(self):
    if(not self.valid_configuration):
      return 0
    return self.get_R() * self.r_wheel * self.motor_max_torque/(self.I_flywheel())
  
  def max_acceleration_horizontal_pendulum(self):
    if(not self.valid_configuration):
      return 0
    return self.m_cylinder() * self.g * (self.r_flywheel/3)/(self.r_wheel *(self.m_total()+ self.m_wheel))

  def max_acceleration_horizontal_pendulum(self):
    if(not self.valid_configuration):
      return 0
    return self.m_cylinder() * self.g * (self.r_flywheel/3)/(self.r_wheel *(self.m_total()+ self.m_wheel))

  def max_sin_pendulum(self):
    if(not self.valid_configuration):
      return 0
    return self.m_cylinder() * (self.r_flywheel/3)/(self.r_wheel *  self.m_total())

  def max_sin_flywheel(self):
    if(not self.valid_configuration):
      return 0
    return self.motor_max_torque /(self.r_wheel *self.m_total()* self.g)

my_robot = Robot()
resolution = 300


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
      if (my_robot.max_sin_pendulum()/my_robot.m_total()>aux_sin_pendulum):
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