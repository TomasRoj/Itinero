import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule, Router } from '@angular/router';
import { TripService, Trip } from '../../services/trip-service.service';
import { UserService } from '../../services/user-service.service';
import { forkJoin, Observable, of } from 'rxjs';
import { TripMemberService } from '../../services/trip-member.service';
import { switchMap, map, catchError } from 'rxjs/operators';

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
        this.userService.getCurrentUser().subscribe({
          next: (user) => {
            this.username = user.name;
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
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
            
            const uniqueTrips = allTrips.filter(
              (trip, index, self) => index === self.findIndex(t => t.id === trip.id)
            );
            
            const tripsWithMemberCounts$ = uniqueTrips.map(trip => {
              if (!trip.id) {
                console.error('Trip without ID found:', trip);
                return of([trip, 0] as [Trip, number]);
              }
              
              return this.TripMemberService.getMembersByTripId(trip.id).pipe(
                map(members => [trip, members.length] as [Trip, number]),
                catchError(error => {
                  console.error(`Error fetching members for trip ${trip.id}:`, error);
                  return of([trip, 0] as [Trip, number]);
                })
              );
            });
            
            forkJoin(tripsWithMemberCounts$).subscribe(tripsWithCounts => {
              this.trips = tripsWithCounts.map(([trip, memberCount]) => ({
                id: trip.id,
                destination: trip.name,
                country: 'Country',
                image: trip.photoURL || 'default.png',
                dateRange: this.formatDateRange(new Date(trip.start_date), new Date(trip.end_date)),
                participants: memberCount,
                description: trip.description || 'No description available'
              }));
            });
          },
          error: (err) => {
            console.error('Chyba při načítání výletů:', err);
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
}