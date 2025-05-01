/**
 * ChatComponent
 *
 * This component handles the chat functionality, including sending text messages,
 * uploading files, and previewing selected files. It uses a socket service for real-time
 * communication.
 */
import { Component, OnInit } from "@angular/core";
import { SocketService } from "../services/socket.service";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit {
  /**
   * Stores the list of chat messages.
   */
  messages: any[] = [];

  /**
   * Stores the new message to be sent.
   */
  newMessage = "";

  /**
   * Stores the currently selected file for upload.
   */
  selectedFile: File | null = null;

  /**
   * Stores the preview URL of the selected file.
   */
  previewUrl: string | null = null;

  /**
   * Stores the type of the selected file.
   */
  fileType: string;

  /**
   * Constructor to inject the SocketService.
   * @param socket - The socket service for real-time communication.
   */
  constructor(private socket: SocketService) {}

  /**
   * Lifecycle hook that is called after the component is initialized.
   * Sets up the socket connection and listens for events.
   */
  ngOnInit() {
    this.socket.on("connect", () => console.log("connected"));
    this.socket.on("newMessage", (history: any[]) => {
      this.messages.push({ content: history });
    });
  }

  /**
   * Sends a text message through the socket.
   * Emits the message to the server and listens for new messages.
   */
  sendMessage() {
    if (this.newMessage.trim()) {
      this.socket.emit("hi", {
        contactRequest: 4,
        dataType: "TEXT",
        content: this.newMessage,
        toId: "user id",
        fromId: "user2 id",
      });

      this.socket.on("newMessage", (history: any[]) => {
        this.messages.push({ content: history });
      });
    }
    this.newMessage = "";
  }

  /**
   * Handles the file selection event.
   * Reads the selected file and generates a preview URL.
   * @param event - The file input change event.
   */
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Determines the type of the selected file based on its MIME type.
   * @param type - The MIME type of the file.
   * @returns The file type as a string (e.g., "IMAGE", "VOICE", "VIDEO", "PDF").
   */
  checkFileType(type: string): string {
    if (type.includes("image")) {
      return "IMAGE";
    }
    if (type.includes("audio")) {
      return "VOICE";
    }
    if (type.includes("video")) {
      return "VIDEO";
    }
    if (type.includes("pdf")) {
      return "PDF";
    }
  }

  /**
   * Uploads the selected file to the server.
   * Emits the file data through the socket and resets the file-related properties.
   */
  uploadFile() {
    if (this.selectedFile) {
      this.checkFileType(this.selectedFile.type);
      const reader = new FileReader();
      reader.onload = () => {
        this.socket.emit("newMessage", {
          type: this.checkFileType(this.selectedFile.type),
          filename: this.selectedFile?.name,
          content: reader.result,
        });
        this.previewUrl = null;
        this.selectedFile = null;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Checks if the given filename corresponds to an image file.
   * @param filename - The name of the file.
   * @returns True if the file is an image, false otherwise.
   */
  isImage(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(filename);
  }

  /**
   * Checks if the given filename corresponds to a video file.
   * @param filename - The name of the file.
   * @returns True if the file is a video, false otherwise.
   */
  isVideo(filename: string): boolean {
    return /\.(mp4|webm)$/i.test(filename);
  }

  /**
   * Checks if the given filename corresponds to a PDF file.
   * @param filename - The name of the file.
   * @returns True if the file is a PDF, false otherwise.
   */
  isPdf(filename: string): boolean {
    return /\.pdf$/i.test(filename);
  }
}
