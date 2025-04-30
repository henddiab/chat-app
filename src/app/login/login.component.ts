/**
 * LoginComponent
 * 
 * This component handles user login functionality. It uses Firebase Authentication
 * for user authentication and securely stores the user's token in local storage.
 * Upon successful login, the user is redirected to the chat page.
 */
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  /**
   * Stores the user's email address.
   */
  email = '';

  /**
   * Stores the user's password.
   */
  password = '';

  /**
   * Constructor to inject dependencies.
   * @param auth - The AngularFireAuth service for Firebase authentication.
   * @param router - The Router service for navigation.
   */
  constructor(private auth: AngularFireAuth, private router: Router) {}

  /**
   * Handles the login process.
   * Authenticates the user with Firebase, encrypts the user's token, and stores it in local storage.
   * Redirects the user to the chat page upon successful login.
   */
  login() {
    this.auth.signInWithEmailAndPassword(this.email, this.password)
      .then(result => {
        // Retrieve the user's unique identifier (UID) as the token
        const plainToken = result.user?.uid || '';

        // Encrypt the token using AES encryption
        const encryptedToken = CryptoJS.AES.encrypt(plainToken, 'secret-key').toString();

        // Decrypt the token for verification (optional)
        const decrypted = CryptoJS.AES.decrypt(encryptedToken, 'secret-key').toString(CryptoJS.enc.Utf8);
        console.log('Decrypted token:', decrypted);

        // Store the encrypted token in local storage
        localStorage.setItem('token', encryptedToken);

        // Navigate to the chat page
        this.router.navigate(['/chat']);
      })
      .catch(error => console.error('Login failed', error));
  }
}