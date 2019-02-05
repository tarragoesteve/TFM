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
  
  def set_r_flywheel(self,r_flywheel):
    self.r_flywheel = r_flywheel
    self.r_wheel = math.sqrt((r_flywheel+self.b)**2+(self.h/2)**2) + 0.01
    if (self.r_external>self.r_wheel):
      self.L_robot = 2 * math.sqrt(self.r_external**2-self.r_wheel**2)
      self.w = self.L_robot-self.L_rest
      self.valid_configuration = self.w > 0
    else:
      self.valid_configuration = False
      
  def set_r_flywheel_r_wheel(self,r_flywheel,r_wheel):
    self.r_flywheel = r_flywheel
    min_r_wheel = math.sqrt((r_flywheel+self.b)**2+(self.h/2)**2) + 0.01
    if (min_r_wheel<r_wheel  and self.r_external>r_wheel):
      self.r_wheel = r_wheel
      self.L_robot = 2 * math.sqrt(self.r_external**2-self.r_wheel**2)
      self.w = self.L_robot-self.L_rest
      self.valid_configuration = self.w > 0   
    else:
      self.valid_configuration = False
    
  def max_speed_horizontal_flywheel(self):
    if(not self.valid_configuration):
      return 0
    return self.motor_max_speed * self.get_R() * self.r_wheel
  
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

my_robot = Robot()
r_flywheel=numpy.linspace(0.00,my_robot.r_external,100)
max_speeds = []
for r in r_flywheel:
  my_robot.set_r_flywheel(r)
  max_speeds = numpy.append(max_speeds, my_robot.max_speed_horizontal_flywheel())
import matplotlib.pyplot as plt
plt.figure()
plt.title('max speed vs flywheel radius')

plt.xlabel('r flywheel [m]')
plt.ylabel('max speed [m/s]')
plt.plot(r_flywheel,max_speeds)
plt.legend(['max speed'])

max_heights = []
for r in r_flywheel:
  my_robot.set_r_flywheel(r)
  max_heights = numpy.append(max_heights, my_robot.max_height_flywheel())
import matplotlib.pyplot as plt
plt.figure()
plt.title('height vs flywheel radius')

plt.xlabel('r flywheel [m]')
plt.ylabel('height [m]')
plt.plot(r_flywheel,max_heights)
plt.legend(['height'])

max_acceletarion_flywheel = []
for r in r_flywheel:
  my_robot.set_r_flywheel(r)
  max_acceletarion_flywheel = numpy.append(max_acceletarion_flywheel, my_robot.max_acceleration_horizontal_flywheel())
import matplotlib.pyplot as plt
plt.figure()
plt.title('flywheel acceletarion vs flywheel radius')

plt.xlabel('r flywheel [m]')
plt.ylabel('acceleration [m/s^2]')
plt.plot(r_flywheel,max_acceletarion_flywheel)
plt.legend(['flywheel acceleration'])

max_acceletarion_pendulum = []
for r in r_flywheel:
  my_robot.set_r_flywheel(r)
  max_acceletarion_pendulum = numpy.append(max_acceletarion_pendulum, my_robot.max_acceleration_horizontal_pendulum())
import matplotlib.pyplot as plt
plt.figure()
plt.title('pendulum acceletarion vs flywheel acceleration')

plt.xlabel('r flywheel [m]')
plt.ylabel('acceleration [m/s^2]')
plt.plot(r_flywheel,max_acceletarion_flywheel)
plt.plot(r_flywheel,max_acceletarion_pendulum)
plt.legend(['flywheel acceleration','pendulum acceletarion'])
plt.ylim(0,1)

x = numpy.linspace(0.00,my_robot.r_external,1000)
y = numpy.linspace(0,my_robot.r_external,1000)
xv, yv = numpy.meshgrid(x, y)

max_value = 0
max_argument = (0,0)
zv = numpy.zeros((1000,1000))
for i in range(1000):
  for j in range(1000):
    my_robot.set_r_flywheel_r_wheel(x[i],y[j])
    zv[i][j]= my_robot.max_acceleration_horizontal_pendulum()
    if(zv[i][j] > max_value):
      max_value = zv[i][j]
      max_argument = (x[i],y[j])

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm

print(max_value,max_argument)

fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
surf = ax.plot_surface(xv,yv,zv,cmap=cm.coolwarm)
fig.colorbar(surf, shrink=0.5, aspect=5)
#ax.set_zlim3d(0,2)
plt.show()
r_fly, r_wheel = max_argument
my_robot.set_r_flywheel_r_wheel(r_fly,r_wheel)
print(my_robot.L_robot, my_robot.w)