import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { UserService, User } from '../../services/user-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SidebarComponent, RouterLink, CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  user: User = {
    id: 0,
    name: '',
    surname: '',
    email: '',
    preferedcurrency: '',
    profile_picture: ''
  };
  
  passwordField: string = '';
  selectedFile: File | null = null;
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.user.profile_picture = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeProfilePicture(): void {
    this.user.profile_picture = 'default.png';
    this.selectedFile = null;
  }

  saveChanges(): void {
    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = '';
    if (this.passwordField) {

      this.user.password_hash = this.passwordField;
    }

    this.userService.updateUser(this.user).subscribe({
      next: () => {
        // If a new profile picture was selected, upload it
        if (this.selectedFile) {
          this.userService.updateProfilePicture(this.user.id, this.selectedFile).subscribe({
            next: () => {
              this.handleSuccess();
            },
            error: (error) => this.handleError(error)
          });
        } else {
          this.handleSuccess();
        }
      },
      error: (error) => this.handleError(error)
    });
  }

  private handleSuccess(): void {
    this.isLoading = false;
    this.saveSuccess = true;
    this.passwordField = '';
    setTimeout(() => {
      this.saveSuccess = false;
    }, 3000);
  }

  private handleError(error: any): void {
    this.isLoading = false;
    this.saveError = 'Nepodařilo se uložit změny. Zkuste to prosím znovu.';
    console.error('Error saving user data:', error);
    setTimeout(() => {
      this.saveError = '';
    }, 5000);
  }
}