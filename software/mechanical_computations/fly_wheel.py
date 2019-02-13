# -*- coding: utf-8 -*-

import math
import numpy
import scipy
from scipy import optimize, integrate


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
    return 0.3 + self.w
  
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


def system_function(robot):
    def aux_function (t,x):
        if x[0] <= my_robot.r_flywheel/3.0:
            #r = r_min
            #print('r_min')
            return [max(0,x[1]),
            max(0,-robot.g * math.sin(math.pi/2 -x[2]) + x[0] * x[3]*x[3]),
            x[3],
            + robot.m_cylinder() * robot.g * (x[0] - robot.r_flywheel*2/3) * math.sin(x[2]) / robot.I_flywheel(x[0])
            ]
        if x[0] >= my_robot.r_flywheel*2.0/3.0:
            #r = r_max
            #print('r_max')
            return [min(0,x[1]),
            min(0,-robot.g * math.sin(math.pi/2 -x[2]) + x[0] * x[3]*x[3]),
            x[3],
            + robot.m_cylinder() * robot.g * (x[0] - robot.r_flywheel*2/3) * math.sin(x[2]) / robot.I_flywheel(x[0])
            ]
        return [x[1],
        -robot.g * math.sin(math.pi/2 -x[2]) + x[0] * x[3]*x[3],
        x[3],
        + robot.m_cylinder() * robot.g * (x[0] - robot.r_flywheel*2/3) * math.sin(x[2]) / robot.I_flywheel(x[0])
        ]
    return lambda t,x: aux_function(t,x)

my_robot = Robot()
my_robot.set_r_flywheel_r_wheel_w(.05,.07,.02)

system = system_function(my_robot)

def r_max_event(t, x):
    if (x[1]<=0):
        return -1
    return x[0] - my_robot.r_flywheel*2.0/3.0

def r_min_event(t, x):
    if (x[1]>=0):
        return 1
    return x[0] - my_robot.r_flywheel/3.0

r_max_event.terminal = True
r_max_event.direction = 1
r_min_event.terminal = True
r_min_event.direction = -1

bounce_percentage = 0.1 #totally inelastic

def next_initial(final_condition):
    if(abs(- bounce_percentage *final_condition[1])<0.001):
        final_condition[1] = 0
    return [min(max(final_condition[0],my_robot.r_flywheel/3.0),my_robot.r_flywheel*2.0/3.0), - bounce_percentage *final_condition[1],final_condition[2],final_condition[3]]

initial_contition = [my_robot.r_flywheel*2/3.0,0.0,math.pi,5*math.pi]
total_t= 6
accumulated_t=0.0
results = [initial_contition]
time_array = []
r_array = []
d_r_array = []
omega_array = []
d_omega_array = []

while(accumulated_t<total_t):
#for i in range(34):
    ode_int = scipy.integrate.solve_ivp(system_function(my_robot), (accumulated_t,total_t+.0001), initial_contition,max_step=0.001, method='RK45',dense_output=True , events=[r_max_event,r_min_event])
    time_array = numpy.append(time_array,ode_int.t)
    r_array = numpy.append(r_array,ode_int.y[0])
    d_r_array = numpy.append(d_r_array,ode_int.y[1])
    omega_array = numpy.append(omega_array,ode_int.y[2])
    d_omega_array = numpy.append(d_omega_array,ode_int.y[3])

    initial_contition = next_initial([ode_int.y[0][-1],ode_int.y[1][-1],ode_int.y[2][-1],ode_int.y[3][-1]])
    accumulated_t = ode_int.t[-1]
    print(accumulated_t)

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


plt.show()
print(ode_int)