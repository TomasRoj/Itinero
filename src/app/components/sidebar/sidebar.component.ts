import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class SidebarComponent {
  navigationItems = [
    { name: 'Dashboard', icon: 'speedometer2', active: true, href: '/dashboard' },
    { name: 'Připojení do skupiny', icon: 'people', href: '' },
    { name: 'Moje výlety', icon: 'map', href: '' },
    { name: 'Prohlížet destinace', icon: 'globe', href: '/destinations' },
    { name: 'Prohlížet atrakce', icon: 'camera', href: '/attractions' },
    { name: 'Přátelé', icon: 'person-plus', href: '' }
  ];
}