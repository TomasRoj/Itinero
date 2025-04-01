import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, SidebarComponent]
})
export class DashboardComponent {
  username: string = 'Kateřino';
  imagePath = "assets/valetta.jpg";
  trips = [
    {
      id: 1,
      destination: 'Valetta',
      country: 'Malta',
      image: 'assets/images/valetta.jpg',
      dateRange: '7.-13.8.2025',
      participants: 5,
      description: 'Lorem ipsum dolor sit amet consectetur. Viverra mauris scelerisque nec in amet tortor tempus nullam sodales.'
    },
    {
      id: 2,
      destination: 'Ammán',
      country: 'Jordánsko',
      image: 'assets/images/amman.jpg',
      dateRange: '1.-7.12.2025',
      participants: 2,
      description: 'Lorem ipsum dolor sit amet consectetur. Viverra mauris scelerisque nec in amet tortor tempus nullam sodales.'
    }
  ];
}