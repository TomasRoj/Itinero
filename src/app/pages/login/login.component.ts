import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(@Inject(AuthService) private auth: AuthService, private router: Router) {}

  onLogin() {
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.setToken(res.token);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        alert('Neplatné přihlašovací údaje');
      }
    });
  }
}
