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
              // Check if this user is the creator based on trip data
              const isCreator = this.tripData && this.tripData.creator_id === user.id;

              // Determine the role - prioritize the database role
              let roleToDisplay = member.role || 'Member';

              // Override with 'Vlastník' if the user is the creator and there's no specific role in DB
              // Or if the role in the database is already set to 'Vlastník' or 'Owner'
              if (isCreator || roleToDisplay === 'Vlastník' || roleToDisplay === 'Owner') {
                roleToDisplay = 'Vlastník';
              }

              console.log(`User ${user.id} role: ${roleToDisplay}`);

              this.groupMembers.push({
                id: member.id || 0,
                name: `${user.name} ${user.surname}`,
                role: roleToDisplay,
                avatar: user.profile_picture || 'assets/avatars/user1.jpg',
                userId: user.id,
                email: user.email
              });

              // Sort the members to show owner first
              this.groupMembers.sort((a, b) => {
                if (a.role === 'Vlastník') return -1;
                if (b.role === 'Vlastník') return 1;
                return 0;
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

    const parsedUserId = Number(userId.trim());
    if (isNaN(parsedUserId)) {
      alert('Neplatné ID uživatele.');
      return;
    }

    // Zabrání přidání uživatele, který už je členem
    const userAlreadyInTrip = this.groupMembers.some(member => member.userId === parsedUserId);
    if (userAlreadyInTrip) {
      alert('Tento uživatel je již členem výletu.');
      return;
    }

    const defaultRole = 'Member';

    this.tripMemberService.addTripMember(this.tripData.id, parsedUserId, defaultRole).subscribe({
      next: (response) => {
        console.log('Member added successfully:', response);
        this.loadTripMembers(this.tripData.id);
        this.typedUserId = '';
      },
      error: (error) => {
        console.error('Error adding member:', error);
        if (error.status === 400) {
          alert('Chyba: Uživatel buď již existuje ve skupině nebo má neplatné ID.');
        } else {
          alert('Chyba při přidávání uživatele. Zkontrolujte konzoli pro více informací.');
        }
      }
    });
  }


  transferOwnership(): void {
    console.log('New owner ID:', this.newOwnerId);

    if (!this.newOwnerId) {
      alert('Zadejte platné ID uživatele.');
      return;
    }

    const userId = parseInt(this.newOwnerId, 10);

    if (isNaN(userId)) {
      alert('Zadejte platné číslo ID.');
      return;
    }

    // Find the member by userId, not by id
    const matchingMember = this.groupMembers.find(m => m.userId === userId);

    if (!matchingMember) {
      alert('Uživatel musí být členem výletu pro převod vlastnictví.');
      return;
    }

    // Debug information
    console.log('Found matching member:', matchingMember);
    console.log('Updating role for member ID:', matchingMember.id);

    // Create a complete update payload
    const updatePayload = {
      id: matchingMember.id,
      trip_id: this.tripData.id,
      user_id: matchingMember.userId,
      role: 'Vlastník'
    };

    this.tripMemberService.updateMemberRole(matchingMember.id, updatePayload).subscribe({
      next: () => {
        console.log('Role updated to owner');

        // If there's a previous owner, update their role
        const currentOwner = this.groupMembers.find(m => m.role === 'Vlastník' && m.id !== matchingMember.id);
        if (currentOwner) {
          console.log('Updating previous owner:', currentOwner);

          const previousOwnerPayload = {
            id: currentOwner.id,
            trip_id: this.tripData.id,
            user_id: currentOwner.userId,
            role: 'Member'
          };

          this.tripMemberService.updateMemberRole(currentOwner.id, previousOwnerPayload).subscribe({
            next: () => {
              console.log('Previous owner updated to member');
              alert('Vlastnictví výletu bylo úspěšně převedeno.');
              this.loadTripMembers(this.tripData.id);
            },
            error: (error) => {
              console.error('Error updating previous owner role:', error);
              alert('Vlastnictví bylo převedeno, ale původní vlastník nebyl aktualizován.');
              this.loadTripMembers(this.tripData.id);
            }
          });
        } else {
          alert('Vlastnictví výletu bylo úspěšně převedeno.');
          this.loadTripMembers(this.tripData.id);
        }
      },
      error: (error) => {
        console.error('Error updating member role:', error);
        alert('Chyba při převodu vlastnictví výletu.');
      }
    });
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

        const isCreator = userMembership.role === 'Owner';

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
                            this.router.navigate(['/dashboard']);
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
