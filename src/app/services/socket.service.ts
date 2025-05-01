import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class SocketService {
  /**
   * The Socket.IO client instance used for WebSocket communication.
   */
  private socket: Socket;

  /**
   * Subject to emit incoming messages from the server.
   */
  private messageSubject = new Subject<any>();

  /**
   * Subject to emit the connection status of the WebSocket.
   */
  private connectionStatus = new Subject<boolean>();

  /**
   * Constructor to initialize the WebSocket connection.
   */
  constructor() {
    this.initializeSocket();
  }

  /**
   * Initializes the WebSocket connection using Socket.IO.
   * Configures connection options such as authentication and reconnection settings.
   */
  private initializeSocket() {
    const token = localStorage.getItem("token");
    this.socket = io(`${environment.socketUrl}/chat`, {
      query: { id: "user id" },
      transports: ["websocket", "xhr-polling"],
      auth: { token: token || "" },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStatus.next(false);
    });
  }

  /**
   * Returns an observable to track the WebSocket connection status.
   * @returns An observable emitting `true` when connected and `false` when disconnected.
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Listens for messages from the server for a specific event.
   * @template T - The type of the data expected from the server.
   * @param eventName - The name of the event to listen for.
   * @returns An observable emitting the data received from the server.
   */
  receive<T = any>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      try {
        this.socket.on(eventName, (data: T) => {
          observer.next(data);
        });

        this.socket.on('error', (error: any) => {
          observer.error(error);
        });

        return () => {
          this.socket.off(eventName);
        };
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Registers a callback function for a specific event from the server.
   * @param eventName - The name of the event to listen for.
   * @param callback - The callback function to execute when the event is received.
   */
  on(eventName: string, callback: (data: any) => void) {
    try {
      this.socket.on(eventName, callback);
    } catch (error) {
      console.error(`Error in socket event listener (${eventName}):`, error);
    }
  }

  /**
   * Emits an event to the server with the specified data.
   * @param eventName - The name of the event to emit.
   * @param data - The data to send with the event.
   * @returns `true` if the event was emitted successfully, otherwise `false`.
   */
  emit(eventName: string, data: any): boolean {
    try {
      this.socket.emit(eventName, data);
      return true;
    } catch (error) {
      console.error(`Error emitting socket event (${eventName}):`, error);
      return false;
    }
  }

  /**
   * Retrieves the unique socket ID assigned by the server.
   * @returns The socket ID as a string, or an empty string if not connected.
   */
  getId(): string {
    return this.socket?.id || '';
  }

  /**
   * Connects to the WebSocket server.
   * @returns A promise that resolves when the connection is successful or rejects on error.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket.connect();
        this.socket.once('connect', () => {
          resolve();
        });
        this.socket.once('connect_error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect() {
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  }

  /**
   * Checks if the WebSocket connection is currently active.
   * @returns `true` if the socket is connected, otherwise `false`.
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}