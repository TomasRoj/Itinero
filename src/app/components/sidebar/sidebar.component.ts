import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  navigationItems = [
    { name: 'Dashboard', icon: 'speedometer2', active: true },
    { name: 'Připojení do skupiny', icon: 'people' },
    { name: 'Moje výlety', icon: 'map' },
    { name: 'Prohlížet destinace', icon: 'globe' },
    { name: 'Prohlížet atrakce', icon: 'camera' },
    { name: 'Přátelé', icon: 'person-plus' }
  ];
}