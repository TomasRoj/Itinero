import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { TripMemberService } from '../../../../services/trip-member.service';
import { TripMember } from '../../../../services/trip-member.service';
import { User } from '../../../../services/user-service.service';
import { UserService } from '../../../../services/user-service.service';
import { forkJoin } from 'rxjs';
import { TripService } from '../../../../services/trip-service.service';
import { Trip } from '../../../../services/trip-service.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-members-tab',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './members-tab.component.html',
  styleUrl: './members-tab.component.scss'

})
export class MembersTabComponent {

  private apiBaseUrl = 'http://localhost:5253/api';
  tripData: any = null;
  typedUserId: string = '';
  newOwnerId: string = '';
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private tripService: TripService,
    private router: Router,
    private http: HttpClient
  ) { }

  openDropdown: string | null = null;

  toggleDropdown(dropdownId: string): void {
    this.openDropdown = this.openDropdown === dropdownId ? null : dropdownId;
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdown === dropdownId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-button')) {
      this.openDropdown = null;
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      this.loadTripMembers(tripId);

      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = response;
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });

    });
  }

  removeUser(memberId: number) {
    console.log('Removing user with member ID:', memberId);

    if (!memberId) {
      console.error('Invalid member ID');
      return;
    }

    this.tripMemberService.deleteTripMember(memberId).subscribe({
      next: () => {
        console.log('Member removed successfully');
        // Refresh the members list
        if (this.tripData && this.tripData.id) {
          this.loadTripMembers(this.tripData.id);
        }
      },
      error: (error) => {
        console.error('Error removing member:', error);
      }
    });
  }

  loadTripMembers(tripId: number): void {
    this.tripMemberService.getMembersByTripId(tripId).subscribe({
      next: (members: TripMember[]) => {
        console.log('Members loaded:', members);
        this.groupMembers = [];

        members.forEach(member => {
          this.http.get<User>(`http://localhost:5253/api/Users/${member.user_id}`).subscribe({
            next: (user) => {
              const isCreator = this.tripData && this.tripData.creator_id === user.id;
              this.groupMembers.push({
                id: member.id || 0,
                name: `${user.name} ${user.surname}`,
                role: isCreator ? 'Vlastník' : (member.role || 'Member'),
                avatar: user.profile_picture || 'assets/avatars/user1.jpg',
                userId: user.id,
                email: user.email
              });
            },
            error: (err) => {
              console.error(`Error loading user ${member.user_id}:`, err);
              this.groupMembers.push({
                id: member.id || 0,
                name: `User ID: ${member.user_id}`,
                role: member.role || 'Member',
                avatar: 'assets/avatars/user1.jpg',
                userId: member.user_id
              });
            }
          });
        });
      },
      error: (error) => {
        console.error('Error loading trip members:', error);
      }
    });
  }

  addUser(userId: string): void {
    console.log('Adding user with ID:', userId);
  
    if (!userId || !this.tripData?.id) {
      console.error('Invalid user ID or trip data');
      return;
    }
  
    this.tripMemberService.addTripMember(this.tripData.id, Number(userId)).subscribe({
      next: () => {
        console.log('Member added successfully');
        this.loadTripMembers(this.tripData.id);
        this.typedUserId = '';
      },
      error: (error) => {
        console.error('Error adding member:', error);
      }
    });
  }

    
  transferOwnership(): void { //Nefunguje: Cannot read properties of null (reading 'value')
    console.log('New owner ID:', this.newOwnerId);
      const userId = parseInt(this.newOwnerId, 10);
  
    if (isNaN(userId)) {
      alert('Zadejte platné číslo ID.');
      return;
    }
  
    const isUserMember = this.groupMembers.some(member => member.id === userId);
  
    if (!isUserMember) {
      alert('Uživatel musí být členem výletu pro převod vlastnictví.');
      return;
    }
  
    const matchingMember = this.groupMembers.find(m => m.id === userId);
  
    if (matchingMember) {
      this.tripMemberService.updateMemberRole(matchingMember.id, { role: 'owner' }).subscribe({
        next: () => {
          console.log('Role updated to owner');
          alert('Vlastnictví výletu bylo úspěšně převedeno.');
          this.loadTripMembers(this.tripData.id);
        },
        error: (error) => {
          console.error('Error updating member role:', error);
          alert('Chyba při převodu vlastnictví výletu.');
        }
      });
    }
  }

  leaveTrip(): void {
    console.log('Leaving trip with ID:', this.tripData.id);
  
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.processLeaveTrip(user.id);
      } else {
        this.userService.getCurrentUser().subscribe({
          next: (user) => {
            if (user) {
              this.processLeaveTrip(user.id);
            } else {
              console.error('No user found');
            }
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
          }
        });
      }
    });
  }

  private processLeaveTrip(currentUserId: number): void {
    const tripId = this.tripData.id;

    this.tripMemberService.getTripMembers().subscribe({
      next: (members) => {
        const userMembership = members.find(
          member => member.trip_id === tripId && member.user_id === currentUserId
        );

        if (!userMembership) {
          console.error('User is not a member of this trip');
          return;
        }

        const isCreator = userMembership.role === 'owner';

        this.tripMemberService.deleteTripMember(userMembership.id).subscribe({
          next: () => {
            if (isCreator) {
              this.http.get<any[]>(`${this.apiBaseUrl}/Itinerary/days?tripId=${tripId}`).subscribe({
                next: (tripDays) => {
                  const deleteRequests = tripDays.map(day =>
                    this.http.delete(`${this.apiBaseUrl}/Itinerary/day/${day.id}`)
                  );

                  if (deleteRequests.length > 0) {
                    forkJoin(deleteRequests).subscribe({
                      next: () => {
                        console.log('All itinerary days deleted successfully');
                        this.tripService.deleteTrip(tripId).subscribe({
                          next: () => {
                            console.log('Trip deleted successfully');
                            this.tripData = null;
                            this.router.navigate(['/dahboard']);
                          },
                          error: (error) => {
                            console.error('Error deleting trip:', error);
                          }
                        });
                      },
                      error: (error) => {
                        console.error('Error deleting itinerary days:', error);
                      }
                    });
                  } else {
                    this.tripService.deleteTrip(tripId).subscribe({
                      next: () => {
                        console.log('Trip deleted successfully');
                        this.tripData = null;
                        this.router.navigate(['/dashboard']);
                      },
                      error: (error) => {
                        console.error('Error deleting trip:', error);
                      }
                    });
                  }
                },
                error: (error) => {
                  console.error('Error fetching itinerary days:', error);
                }
              });
            } else {
              console.log('Successfully left the trip');
              this.tripData = null;
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error) => {
            console.error('Error removing member:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching trip members:', error);
      }
    });
  }

}
