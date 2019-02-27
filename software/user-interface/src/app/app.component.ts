import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import * as socketio from "socket.io-client";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent {
  left_value = 0;
  right_value = 0;
  socket: SocketIOClient.Socket;

  constructor() {
    this.socket = socketio.connect('http://localhost:3000')
   }


  onChange(value,id){
    console.log(value,id);
    this.socket.emit("input", {"value":value, "id": id});
  }


}
