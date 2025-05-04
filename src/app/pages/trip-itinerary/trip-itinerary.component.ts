import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';
import { TripMember, TripMemberService } from '../../services/trip-member.service';
import { User, UserService } from '../../services/user-service.service';
import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../services/shared.service';

// New interfaces for itinerary data
interface ItineraryDay {
  id: number;
  trip_id: number;
  day_number: number;
  description?: string;
  date?: string;
  created_at: Date;
  updated_at: Date;
}

interface ItineraryItem {
  id: number;
  day_id: number;
  name: string;
  description?: string;
  start_time?: string; 
  end_time?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, FormsModule],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {

  tripData: any = null;
  activeDay: number = 1;
  itineraryDays: ItineraryDay[] = [];
  currentDayItems: ItineraryItem[] = [];
  currentDayData: ItineraryDay | null = null;
  isLoading: boolean = false;
  
  // Form fields for new item
  newItem: {
    name: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
  } = {
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: ''
  };

  // API base URL
  private apiBaseUrl = 'http://localhost:5253/api';

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
    private http: HttpClient,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      let dayCount: number = 0;

      this.sharedService.activeTab$.subscribe(tab => {
        this.activeTab = tab;
      });

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

          dayCount = Math.floor((new Date(this.tripData.end_date).getTime() - new Date(this.tripData.start_date).getTime()) / (1000 * 3600 * 24)) + 1;
          this.sharedService.dayCount.next(dayCount);

          this.loadTripMembers(tripId);
          this.loadItineraryDays(tripId);
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
    
    // Subscribe to day selection events from sidebar
    this.sharedService.selectedDay.subscribe(dayNumber => {
      if (dayNumber && this.tripData) {
        this.changeActiveDay(dayNumber);
      }
    });
  }

  loadItineraryDays(tripId: number): void {
    this.isLoading = true;
    
    // Získáme všechny dny itineráře
    this.http.get<ItineraryDay[]>(`${this.apiBaseUrl}/Itinerary/days`).subscribe({
      next: (days) => {
        console.log('Všechny načtené dny:', days);
        
        // Filtrujeme dny pro tento konkrétní výlet podle trip_id
        this.itineraryDays = days.filter(day => day.trip_id === tripId);
        console.log('Filtrované dny pro výlet ID', tripId, ':', this.itineraryDays);
        
        // Pokud neexistují žádné dny, vytvoříme je
        if (this.itineraryDays.length === 0) {
          console.log('Vytvářím nové dny pro výlet');
          this.createInitialDays(tripId);
        } else {
          // Výchozí načtení prvního dne
          this.changeActiveDay(1);
          
          // Aktualizujeme SharedService s počtem dnů pro sidebar
          const dayCount = this.itineraryDays.length;
          this.sharedService.dayCount.next(dayCount);
          
          // Nastavíme tripId v SharedService, pokud ho používáme
          if (this.sharedService.tripId) {
            this.sharedService.tripId.next(tripId);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Chyba při načítání dnů itineráře:', error);
        this.isLoading = false;
      }
    });
  }
  
  // Aktualizujeme také metodu createInitialDays, aby správně vypočítala dny
  createInitialDays(tripId: number): void {
    const startDate = new Date(this.tripData.start_date);
    const endDate = new Date(this.tripData.end_date);
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    
    console.log(`Vytvářím ${dayCount} dnů pro výlet od ${startDate.toISOString()} do ${endDate.toISOString()}`);
    
    const createDayPromises = [];
    
    for (let i = 1; i <= dayCount; i++) {
      // Vypočítáme datum pro tento den přidáním (i-1) dnů k počátečnímu datu
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + (i - 1));
      
      // Formátujeme datum jako řetězec (YYYY-MM-DD)
      const formattedDate = currentDayDate.toISOString().split('T')[0];
      
      const dayData = {
        trip_id: tripId,
        day_number: i,
        description: `Den ${i} výletu ${this.tripData.name} (${formattedDate})`,
        date: formattedDate
      };
      
      console.log(`Vytvářím den ${i} s datem ${formattedDate}`);
      
      const promise = this.http.post<ItineraryDay>(`${this.apiBaseUrl}/Itinerary/day`, dayData).toPromise();
      createDayPromises.push(promise);
    }
    
    Promise.all(createDayPromises)
      .then(createdDays => {
        const validDays = createdDays.filter(Boolean) as ItineraryDay[];
        console.log('Úspěšně vytvořené dny:', validDays);
        this.itineraryDays = validDays;
        
        // Aktualizujeme SharedService s počtem dnů
        this.sharedService.dayCount.next(dayCount);
        
        // Nastavíme výchozí aktivní den
        this.changeActiveDay(1);
      })
      .catch(error => {
        console.error('Chyba při vytváření dnů itineráře:', error);
      });
  }
  
  changeActiveDay(dayNumber: number): void {
    this.activeDay = dayNumber;
  
    
    // Find the corresponding date for the selected day number
    const selectedDate = this.itineraryDays[dayNumber - 1]?.date;
    console.log('Vybraný den:', selectedDate);


    if (selectedDate) {
      // Find the day data where the date matches the selected date
      const day = this.itineraryDays.find(d => d.date === selectedDate);
      
      if (day) {
        this.currentDayData = day;
        this.loadDayItems(day.id);
  
        // Update the SharedService with the selected day
        this.sharedService.selectedDay.next(dayNumber);
      } else {
        console.error(`Day with date ${selectedDate} not found in itinerary`);
        this.currentDayData = null;
        this.currentDayItems = [];
      } 
    } else {
      console.error(`No day found for day number ${dayNumber}`);
      this.currentDayData = null;
      this.currentDayItems = [];
    } 
  }

  loadDayItems(dayId: number): void {
    return; 
    this.isLoading = true;
    
    // Get all items for this day
    this.http.get<ItineraryItem[]>(`${this.apiBaseUrl}/Itinerary/items`).subscribe({
      next: (items) => {
        // Filter items for this specific day
        this.currentDayItems = items.filter(item => item.day_id === dayId);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading day items:', error);
        this.isLoading = false;
      }
    }); 
  }

  addNewItem(): void {
    if (!this.currentDayData) {
      console.error('No active day selected');
      return;
    }
    
    if (!this.newItem.name.trim()) {
      alert('Please enter a name for the item');
      return;
    }
    
    const newItemData = {
      day_id: this.currentDayData.id,
      name: this.newItem.name,
      description: this.newItem.description,
      start_time: this.newItem.start_time,
      end_time: this.newItem.end_time,
      location: this.newItem.location
    };
    
    this.http.post<ItineraryItem>(`${this.apiBaseUrl}/Itinerary/item`, newItemData).subscribe({
      next: (createdItem) => {
        this.currentDayItems.push(createdItem);
        
        // Reset form
        this.newItem = {
          name: '',
          description: '',
          start_time: '',
          end_time: '',
          location: ''
        };
      },
      error: (error) => {
        console.error('Error adding new item:', error);
      }
    });
  }

  updateItem(item: ItineraryItem): void {
    this.http.put<ItineraryItem>(`${this.apiBaseUrl}/Itinerary/item/${item.id}`, item).subscribe({
      next: (updatedItem) => {
        console.log('Item updated successfully:', updatedItem);
        
        // Update the item in the current items array
        const index = this.currentDayItems.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
          this.currentDayItems[index] = updatedItem;
        }
      },
      error: (error) => {
        console.error('Error updating item:', error);
      }
    });
  }

  deleteItem(itemId: number): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.http.delete(`${this.apiBaseUrl}/Itinerary/item/${itemId}`).subscribe({
        next: () => {
          console.log('Item deleted successfully');
          this.currentDayItems = this.currentDayItems.filter(item => item.id !== itemId);
        },
        error: (error) => {
          console.error('Error deleting item:', error);
        }
      });
    }
  }

  updateDayDescription(): void {
    if (!this.currentDayData) {
      return;
    }
    
    this.http.put<ItineraryDay>(
      `${this.apiBaseUrl}/Itinerary/day/${this.currentDayData.id}`, 
      this.currentDayData
    ).subscribe({
      next: (updatedDay) => {
        console.log('Day description updated successfully:', updatedDay);
        
        // Update the day in the days array
        const index = this.itineraryDays.findIndex(d => d.id === updatedDay.id);
        if (index !== -1) {
          this.itineraryDays[index] = updatedDay;
        }
      },
      error: (error) => {
        console.error('Error updating day description:', error);
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

  updateTripData() {
    const destination = document.getElementById('destinationName') as HTMLInputElement;
    const tripName = document.getElementById('tripName') as HTMLInputElement;
    const description = document.getElementById('descriptionField') as HTMLInputElement;

    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: tripName.value || this.tripData.name,
      destination_city_id: this.tripData.destination_city_id, // to be modified to change place by ID + autocomplete
      start_date: this.startDate ? new Date(this.startDate) : this.tripData.start_date,
      end_date: this.endDate ? new Date(this.endDate) : this.tripData.end_date,
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: description.value || this.tripData.description,
    };

    this.route.params.subscribe(params => {
      const tripId = +params['id'];

      this.tripService.updateTrip(tripId, updatedTrip).subscribe({
        next: (response) => {
          console.log('Trip updated successfully:', response);
          console.log('Updated trip data:', updatedTrip);

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
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];

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
    this.sharedService.setActiveTab(tab); 
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