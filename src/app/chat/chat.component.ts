import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { SocketService } from "../services/socket.service";
import { Subscription } from 'rxjs';

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy {
  /**
   * Stores the list of chat messages.
   * Each message contains metadata such as sender, recipient, content, and ownership (`own`).
   */
  messages: any[] = [];

  /**
   * Holds the content of the message currently being typed by the user.
   */
  newMessage = "";

  /**
   * Stores the file selected by the user for upload.
   * If no file is selected, it is `null`.
   */
  selectedFile: File | null = null;

  /**
   * Stores the preview URL of the selected file (if applicable).
   * Used for displaying a preview of the file in the UI.
   */
  previewUrl: string | null = null;

  /**
   * Keeps track of all active RxJS subscriptions to ensure proper cleanup.
   */
  private subscriptions: Subscription[] = [];

  /**
   * Indicates whether the WebSocket connection is active (`true`) or not (`false`).
   */
  isConnected = false;

  /**
   * Constructor to inject dependencies.
   * @param socket - An instance of `SocketService` for managing WebSocket communication.
   * @param cdr - An instance of `ChangeDetectorRef` for manually triggering Angular's change detection.
   */
  constructor(private socket: SocketService, private cdr: ChangeDetectorRef) {}

  /**
   * Lifecycle hook that initializes the component.
   * Establishes the WebSocket connection and sets up message listeners.
   */
  ngOnInit() {
    console.log('Initializing chat component...');
    this.initializeSocketConnection();
  }

  /**
   * Establishes a WebSocket connection using the `SocketService`.
   * Subscribes to the connection status and requests message history if connected.
   */
  private initializeSocketConnection() {
    this.subscriptions.push(
      this.socket.getConnectionStatus().subscribe(
        (connected) => {
          console.log('Connection status:', connected);
          this.isConnected = connected;
          if (connected) {
            this.requestMessageHistory();
          }
          this.cdr.detectChanges();
        }
      )
    );

    this.socket.connect()
      .then(() => {
        console.log('Socket connected successfully');
        this.setupMessageListeners();
      })
      .catch(error => {
        console.error('Socket connection failed:', error);
      });
  }

  /**
   * Sets up listeners for incoming messages from the server.
   * - `messageList`: Receives the message history and updates the `messages` array.
   * - `newMessage`: Listens for new messages and appends them to the `messages` array.
   */
  private setupMessageListeners() {
    this.socket.on('messageList', (messages: any[]) => {
      console.log('Received message history:', messages.length, 'messages');
      this.messages = messages.map(msg => ({
        ...msg,
        own: msg.fromId === 'user2-id'
      }));
      this.cdr.detectChanges();
    });

    this.subscriptions.push(
      this.socket.receive<any>('newMessage').subscribe({
        next: (msg) => {
          if (msg.toId === 'user-id' || msg.fromId === 'user2-id') {
            console.log('New message received:', msg);
            this.messages.push({
              ...msg,
              own: msg.fromId === 'user2-id' 
            });
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error receiving message:', error);
        }
      })
    );
  }

  /**
   * Sends a request to the server to retrieve the message history for the current user.
   */
  private requestMessageHistory() {
    try {
      this.socket.emit('getMessageList', {
        userId: 'user-id',
        fromId: 'user2-id'
      });
      console.log('Message history requested');
    } catch (error) {
      console.error('Error requesting message history:', error);
    }
  }

  /**
   * Sends a text message to the server via WebSocket.
   * Updates the local `messages` array with the sent message.
   */
  sendMessage() {
    if (!this.isConnected) {
      console.error('Cannot send message: Socket not connected');
      return;
    }

    if (this.newMessage.trim()) {
      const messageData = {
        contactRequest: 4,
        dataType: "TEXT",
        content: this.newMessage,
        toId: "user-id",
        fromId: "user2-id",
        own: true 
      };
      try {
        const sent = this.socket.emit("newMessage", messageData);
        if (sent) {
          console.log('Message sent successfully:', messageData);
          this.messages.push(messageData);  // Add message to local array
          this.newMessage = "";
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  /**
   * Handles file uploads.
   * Reads the selected file as a Base64 string, sends the file data to the server as a message,
   * and updates the local `messages` array with the file message.
   */
  uploadFile() {
    if (!this.isConnected) {
      console.error('Cannot upload file: Socket not connected');
      return;
    }

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const messageData = {
            contactRequest: 4,
            dataType: "FILE",
            filename: this.selectedFile?.name,
            content: reader.result,
            toId: "user-id",
            fromId: "user2-id",
            own: true
          };

          const sent = this.socket.emit("newMessage", messageData);
          if (sent) {
            console.log('File uploaded successfully');
            this.messages.push(messageData); // Add file message to local messages array
            this.previewUrl = null;
            this.selectedFile = null;
            this.cdr.detectChanges();
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Handles file selection from the file input.
   * Generates a preview URL for the selected file.
   * @param event - The file input change event containing the selected file.
   */
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Checks if the given filename corresponds to an image file.
   * @param filename - The name of the file to check.
   * @returns `true` if the file is an image, otherwise `false`.
   */
  isImage(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(filename);
  }

  /**
   * Checks if the given filename corresponds to a video file.
   * @param filename - The name of the file to check.
   * @returns `true` if the file is a video, otherwise `false`.
   */
  isVideo(filename: string): boolean {
    return /\.(mp4|webm)$/i.test(filename);
  }

  /**
   * Checks if the given filename corresponds to a PDF file.
   * @param filename - The name of the file to check.
   * @returns `true` if the file is a PDF, otherwise `false`.
   */
  isPdf(filename: string): boolean {
    return /\.pdf$/i.test(filename);
  }

  /**
   * Lifecycle hook that cleans up resources when the component is destroyed.
   * Unsubscribes from all active subscriptions and disconnects the WebSocket.
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socket.disconnect();
  }
}
