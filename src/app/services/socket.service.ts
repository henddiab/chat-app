import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private socket: Socket;

  constructor() {
    const token = localStorage.getItem("token");
    this.socket = io(`${environment.socketUrl}/chat`, {
      query: { id: "user id" },
      transports: ["websocket", "xhr-polling"],
      auth: { token: token || "" },
    });
  }

  on(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  disconnect() {
    this.socket.disconnect();
  }

  connect() {
    this.socket.connect();
  }
}
