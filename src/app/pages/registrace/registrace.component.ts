import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './registrace.component.html',
  imports: [CommonModule, FormsModule]
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Hesla se neshodují');
      return;
    }

    const data = {
      name: this.firstName,
      surname: this.lastName,
      email: this.email,
      password: this.password
    };

    this.auth.register(data).subscribe({
      next: () => {
      alert('Registrace proběhla úspěšně');
      this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registrace selhala:', err);
        alert('Registrace selhala (email může být již použit)');
      }
    });
  }
}

