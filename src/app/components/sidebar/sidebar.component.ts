import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { User } from '../../services/user-service.service';
import { UserService } from '../../services/user-service.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class SidebarComponent {
  navigationItems = [
    { name: 'Dashboard', icon: 'speedometer2', href: '/dashboard' },
    { name: 'Připojení do výletu', icon: 'people', href: '/join-group' },
    //{ name: 'Moje výlety', icon: 'map', href: '' }, momentálně není potřeba, pokud se pridaji funkce staci odkomentovat
    { name: 'Prohlížet destinace', icon: 'globe', href: '/destinations' },
    { name: 'Prohlížet atrakce', icon: 'camera', href: '/attractions' },
    { name: 'Přátelé', icon: 'person-plus', href: '/friends' }
  ];

  user: User = {
    id: 0,
    name: '',
    surname: '',
    email: '',
    preferedcurrency: '',
    profile_picture: 'profile.jpg'
  };

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

}