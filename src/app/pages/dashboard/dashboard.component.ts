import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule, Router } from '@angular/router';
import { TripService, Trip } from '../../services/trip-service.service';
import { UserService } from '../../services/user-service.service';
import { forkJoin } from 'rxjs';
import { TripMemberService } from '../../trip-member.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule,]
})
export class DashboardComponent implements OnInit {
  username: string = '';
  trips: any[] = [];

  constructor(private tripService: TripService, private router: Router, private userService: UserService, private TripMemberService: TripMemberService) {}

  ngOnInit(): void {
    this.loadTrips();
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.username = user.name;
      } else {
        // If currentUser is not available yet, try to get it
        this.userService.getCurrentUser().subscribe({
          next: (user) => {
            this.username = user.name;
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
            // Fallback to a default name or handle the error as needed
            this.username = 'User';
          }
        });
      }
    });
  }

  loadTrips(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        const createdTrips$ = this.tripService.getTripsByUserId(user.id);
        const memberTrips$ = this.TripMemberService.getTripsForMember(user.id);
  
        forkJoin([createdTrips$, memberTrips$]).subscribe({
          next: ([createdTrips, memberTrips]) => {
            const allTrips = [...createdTrips, ...memberTrips];
  
            // Odstranění duplikátů podle ID
            const uniqueTrips = allTrips.filter(
              (trip, index, self) => index === self.findIndex(t => t.id === trip.id)
            );
  
            this.trips = uniqueTrips.map(trip => ({
              id: trip.id,
              destination: trip.name,
              country: 'Country',
              image: 'assets/images/default.jpg',
              dateRange: this.formatDateRange(new Date(trip.start_date), new Date(trip.end_date)),
              participants: 0,
              description: trip.description || 'No description available'
            }));
          },
          error: (err) => {
            console.error('Chyba při načítání výletů:', err);
            this.loadStaticTrips();
          }
        });
      },
      error: (err) => {
        console.error('Nepodařilo se načíst uživatele:', err);
      }
    });
  }
  

  getItemDetails(itemId: number): void {
    this.tripService.getTripById(itemId).subscribe({
      next: (response) => {
        console.log('Data získána:', response);
        this.router.navigate(['/trip-itinerary/', itemId]);
      },
      error: (error) => {
        console.error('Chyba při získávání dat:', error);
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