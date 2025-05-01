import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';
import { TripMember, TripMemberService } from '../../services/trip-member.service';
import { User, UserService } from '../../services/user-service.service';
import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, FormsModule],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {

  tripData: any = null;

  @Output() changedDates = new EventEmitter<{startDate: string, endDate: string}>();
  startDate: string = '';
  endDate: string = '';

  onDateChange() {
    this.changedDates.emit({ startDate: this.startDate, endDate: this.endDate });
    console.log('Změna data:', this.startDate, this.endDate);
  }

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

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Získání ID z URL parametru
    this.route.params.subscribe(params => {
      const tripId = +params['id']; // Konverze na číslo
      
      // Načtení dat podle ID
      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = response;
          const startDate = document.getElementById('startDate') as HTMLInputElement;
          const endDate = document.getElementById('endDate') as HTMLInputElement;
          const destination = document.getElementById('destinationName') as HTMLInputElement;
          const tripName = document.getElementById('tripName') as HTMLInputElement;
          const description = document.getElementById('descriptionField') as HTMLInputElement;

          startDate.placeholder = new Date(this.tripData.start_date).toDateString();
          endDate.placeholder = new Date(this.tripData.end_date).toDateString();
          destination.placeholder = this.tripData.destination_city_id.toString();
          tripName.placeholder = this.tripData.name.toString();
          description.placeholder = this.tripData.description.toString();

          this.loadTripMembers(tripId);
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
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

  updateTripData() {
    
    const destination = document.getElementById('destinationName') as HTMLInputElement;
    const tripName = document.getElementById('tripName') as HTMLInputElement;
    const description = document.getElementById('descriptionField') as HTMLInputElement;

    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: tripName.value || this.tripData.name,
      destination_city_id:this.tripData.destination_city_id, // toto zmenit ppozdeji aby se menilo misto podle ID + naseptavac
      start_date: this.startDate ? new Date(this.startDate) : this.tripData.start_date,
      end_date: this.endDate ? new Date(this.endDate) : this.tripData.end_date,      
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: description.value || this.tripData.description,
    };

    interface Trip {
      id?: number;
      name: string;
      creator_id: number;
      destination_city_id: number;
      start_date: Date;
      end_date: Date;
      description?: string;
      is_public: boolean;
      created_at: Date;
      updated_at: Date;
    }

    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      

      this.tripService.updateTrip(tripId, updatedTrip).subscribe({
        next: (response) => {
          console.log('Trip updated successfully:', response);
          console.log('Aktualizovaná data výletu:', updatedTrip);

          // dodelat nejakej element kam se zobrazi succes hlaska, ze data byla updated

        },
        error: (error) => {
          console.error('Error updating trip:', error);
        }
      });
    });

  }
  activeTab = 'destinace'; 
  
  groupId = 'd516';
  newOwnerId: string = '';
  groupMembers: {id: number, name: string, role: string, avatar: string, userId: number, email?: string}[] = [];
  expenses = [
    {
      id: 1,
      description: 'Večeře na Maltě',
      paidBy: 'Tomáš Veselý',
      date: new Date('2025-04-05'),
      amount: 1250,
      currency: 'Kč',
      isSettled: true
    },
    {
      id: 2,
      description: 'Vodní skútr',
      paidBy: 'Honza Novák',
      date: new Date('2025-04-04'),
      amount: 3500,
      currency: 'Kč',
      isSettled: true
    },
    {
      id: 3,
      description: 'Letenky',
      paidBy: 'Pepa Petrovský',
      date: new Date('2025-04-01'),
      amount: 8700,
      currency: 'Kč',
      isSettled: false
    }
  ];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  transferOwnership(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.newOwnerId = inputElement.value;
    console.log('New owner ID:', this.newOwnerId);
    
    if (!this.newOwnerId || !this.tripData || !this.tripData.id) {
      return;
    }
    
    const userId = parseInt(this.newOwnerId);
    const isUserMember = this.groupMembers.some(member => member.userId === userId);
    
    if (!isUserMember) {
      alert('Uživatel musí být členem výletu pro převod vlastnictví.');
      return;
    }
    
    const updatedTrip: Trip = {
      ...this.tripData,
      creator_id: userId,
      updated_at: new Date()
    };
    
    this.tripService.updateTrip(this.tripData.id, updatedTrip).subscribe({
      next: (response) => {
        console.log('Ownership transferred successfully:', response);
        alert('Vlastnictví výletu bylo úspěšně převedeno.');
        
        this.tripData = response;
        
        this.loadTripMembers(this.tripData.id);
      },
      error: (error) => {
        console.error('Error transferring ownership:', error);
        alert('Chyba při převodu vlastnictví výletu.');
      }
    });
  }

  goBack(): void {
    console.log('Zpět');
  }

  addExpense(): void {
    console.log('Přidat výdaj');
  }

  showUsedCurrency(currency: string) {
    console.log('Showing used names for currency:', currency);
  }
}
