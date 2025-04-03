import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionaireNavbarComponent } from '../../components/questionaire-navbar/questionaire-navbar.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, QuestionaireNavbarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  onSubmit() {
    // Handle login logic here
    console.log('Login attempt with:', this.email);
  }
}
