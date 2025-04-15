// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { TripService, Trip } from '../../services/trip-service.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule]
})
export class DashboardComponent implements OnInit {
  username: string = 'Kateřino';
  trips: any[] = [];

  constructor(private tripService: TripService) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.tripService.getTrips().subscribe({
      next: (data: Trip[]) => {
        this.trips = data.map(trip => {
          return {
            id: trip.id,
            destination: trip.name,
            country: 'Country',
            image: 'assets/images/default.jpg',
            dateRange: this.formatDateRange(new Date(trip.start_date), new Date(trip.end_date)),
            participants: 0,
            description: trip.description || 'No description available'
          };
        });
      },
      error: (error) => {
        console.error('Error fetching trips:', error);
        this.loadStaticTrips();
      }
    });
  }

  private formatDateRange(startDate: Date, endDate: Date): string {
    return `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}-${endDate.getDate()}.${endDate.getMonth() + 1}.${endDate.getFullYear()}`;
  }

  loadStaticTrips(): void {
    this.trips = [
      {
        id: 1,
        destination: 'Valetta',
        country: 'Malta',
        image: 'valetta.jpg',
        dateRange: '7.-13.8.2025',
        participants: 5,
        description: 'Lorem ipsum dolor sit amet consectetur. Viverra mauris scelerisque nec in amet tortor tempus nullam sodales.'
      },
      {
        id: 2,
        destination: 'Ammán',
        country: 'Jordánsko',
        image: 'amman.jpg',
        dateRange: '1.-7.12.2025',
        participants: 2,
        description: 'Lorem ipsum dolor sit amet consectetur. Viverra mauris scelerisque nec in amet tortor tempus nullam sodales.'
      }
    ];
  }
}