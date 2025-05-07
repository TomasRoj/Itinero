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
import { HttpParams } from '@angular/common/http';
import { Expense, ExpenseCategory, ExpenseSplit, ExpenseService } from '../../services/finance-service.service';

interface DisplayExpense {
  id: number;
  description: string;
  paidByUserId: number;
  date: Date;
  amount: number;
  currency: string;
  isSettled: boolean;
}

interface ItineraryDay {
  id: number;
  trip_id: number;
  description?: string;
  date: Date;
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
  placeholders: {
    startDate: string;
    endDate: string;
    destination: string;
    tripName: string;
    description: string;
  } = {
    startDate: '',
    endDate: '',
    destination: '',
    tripName: '',
    description: ''
  };

  tripForm = {
    startDate: '',
    endDate: '',
    destination: '',
    tripName: '',
    description: ''
  };

  tripData: any = null;
  activeDay: number = 1;
  itineraryDays: ItineraryDay[] = [];
  currentDayItems: ItineraryItem[] = [];
  currentDayData: ItineraryDay | null = null;

  private isCreatingDays = false;
  dayDescription: string = '';

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
    private sharedService: SharedService,
    private expenseService: ExpenseService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      let dayCount: number = 0;

      this.sharedService.activeTab$.subscribe(tab => {
        this.activeTab = tab;
      });
     
      this.loadItineraryDays(tripId);

      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = response;
          
          this.placeholders = {
            startDate: new Date(this.tripData.start_date).toDateString(),
            endDate: new Date(this.tripData.end_date).toDateString(),
            destination: this.tripData.destination_city_id.toString(),
            tripName: this.tripData.name.toString(),
            description: this.tripData.description.toString()
          };
          
          let dayCount = 0;
          dayCount = Math.floor(
            (new Date(this.tripData.end_date).getTime() - new Date(this.tripData.start_date).getTime()) / 
            (1000 * 3600 * 24)
          ) + 1;
          this.sharedService.dayCount.next(dayCount);
          
          this.loadTripMembers(tripId);
          this.loadExpenses(tripId);
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
    
    this.sharedService.selectedDay.subscribe(dayNumber => {
      if (dayNumber && this.tripData) {
        this.changeActiveDay(dayNumber);
      }
    });
  }

  loadExpenses(tripId: number): void {
    this.loadingExpenses = true;
    this.expenses = [];
    
    this.expenseService.getExpensesByTripId(tripId).subscribe({
      next: (expensesData) => {
        console.log('Raw expenses data:', expensesData);
        
        if (!expensesData || expensesData.length === 0) {
          console.log('No expenses found for this trip');
          this.loadingExpenses = false;
          return;
        }
        
        this.expenses = expensesData.map(expense => {
          const isSettled = Math.random() > 0.5; // jen pro testovani
          
          return {
            id: expense.id,
            description: expense.name || expense.description || 'Unnamed Expense',
            paidByUserId: expense.paidByUserId,
            date: expense.date,
            amount: expense.amount,
            currency: expense.currency_Code,
            isSettled: isSettled
          };
        });
        
        console.log('Processed expenses:', this.expenses);
        this.loadingExpenses = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.loadingExpenses = false;
        
        if (this.expenses.length === 0) {
          this.expenses = [
            {
              id: 1,
              description: 'Dinner at Restaurant',
              paidByUserId: 1,
              date: new Date(),
              amount: 120,
              currency: 'CZK',
              isSettled: true
            },
            {
              id: 2,
              description: 'Hotel Reservation',
              paidByUserId: 2,
              date: new Date(),
              amount: 2500,
              currency: 'CZK',
              isSettled: false
            }
          ];
        }
      }
    });
  }
  loadItineraryDays(tripId: number): void {
    const params = new HttpParams().set('tripId', String(tripId))
  
    this.http.get<ItineraryDay[]>(`${this.apiBaseUrl}/Itinerary/days`, { params }).subscribe({
      next: (days) => {
        console.log('Načtené dny z API:', days);
        this.itineraryDays = days
        .filter(day => day.trip_id === tripId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
        if (this.itineraryDays.length === 0) {
          console.log('Vytvářím nové dny pro výlet');
          this.createInitialDays(tripId);
        } else {
          this.changeActiveDay(1);
          const dayCount = this.itineraryDays.length;
          this.sharedService.dayCount.next(dayCount);
          if (this.sharedService.tripId) {
            this.sharedService.tripId.next(tripId);
          }
        }
      },
      error: (error) => {
        console.error('Chyba při načítání dnů itineráře:', error);
      }
    });
  }  
  

async createInitialDays(tripId: number): Promise<void> {
  if (this.isCreatingDays) return;
  this.isCreatingDays = true;

  try {

    if (!this.tripData) {
      console.error('Trip data nejsou dostupná.');
      this.isCreatingDays = false;
      return;
    }
    const startDate = new Date(this.tripData.start_date);
    const endDate = new Date(this.tripData.end_date);
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const createDayPromises = [];
    for (let i = 1; i <= dayCount; i++) {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + (i - 1));
      const formattedDate = currentDayDate.toISOString().split('T')[0];

      const dayData = {
        trip_id: tripId,
        day_number: i,
        description: `Den ${i} výletu ${this.tripData.name} (${formattedDate})`,
        date: formattedDate
      };
      createDayPromises.push(
        this.http.post<ItineraryDay>(`${this.apiBaseUrl}/Itinerary/day`, dayData).toPromise()
      );
    }
    await Promise.all(createDayPromises);

    this.isCreatingDays = false;
    this.loadItineraryDays(tripId);
  } catch (error) {
    console.error('Chyba při vytváření dnů itineráře:', error);
    this.isCreatingDays = false;
  }
}  
  
changeActiveDay(dayNumber: number): void {
  this.activeDay = dayNumber;

  // Ověření, že den existuje
  const selectedDay = this.itineraryDays[dayNumber - 1];
  if (selectedDay) {
    this.currentDayData = selectedDay;
    this.dayDescription = selectedDay.description || '';
    this.loadDayItems(selectedDay.id);
  } else {
    this.currentDayData = null;
    this.currentDayItems = [];
    this.dayDescription = '';
  }

  // Debug výpisy
  console.log('Aktivní den:', this.activeDay);
  console.log('Počet dní:', this.itineraryDays.length);

  if (selectedDay) {
    console.log('Date aktivniho dne:', selectedDay.date);
  }
}

  loadDayItems(dayId: number): void {
    
    /*
    this.http.get<ItineraryItem[]>(`${this.apiBaseUrl}/Itinerary/items`).subscribe({
      next: (items) => {
        this.currentDayItems = items.filter(item => item.day_id === dayId);
      },
      error: (error) => {
        console.error('Error loading day items:', error);
      }
    }); */
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
    if (!this.currentDayData) return;
  
    this.currentDayData.description = this.dayDescription;
  
    this.http.put<ItineraryDay>(
      `${this.apiBaseUrl}/Itinerary/day/${this.currentDayData.id}`,
      this.currentDayData
    ).subscribe({
      next: (updatedDay) => {
        const idx = this.itineraryDays.findIndex(d => d.id === updatedDay.id);
        if (idx !== -1) this.itineraryDays[idx] = updatedDay;
      },
      error: (err) => {
        console.error('Chyba při ukládání popisu dne:', err);
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
    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: this.tripForm.tripName || this.tripData.name,
      destination_city_id: this.tripData.destination_city_id, 
      start_date: this.tripForm.startDate ? new Date(this.tripForm.startDate) : this.tripData.start_date,
      end_date: this.tripForm.endDate ? new Date(this.tripForm.endDate) : this.tripData.end_date,
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: this.tripForm.description || this.tripData.description,
    };
  
    const tripId = this.route.snapshot.params['id'];
  
    this.tripService.updateTrip(tripId, updatedTrip).subscribe({
      next: (response) => {
        console.log('Trip updated successfully:', response);
        console.log('Updated trip data:', updatedTrip);
        
        this.tripData = { ...updatedTrip };
        this.updatePlaceholders();
      },
      error: (error) => {
        console.error('Error updating trip:', error);
      }
    });
  }
  
  updatePlaceholders() {
    this.placeholders = {
      startDate: new Date(this.tripData.start_date).toDateString(),
      endDate: new Date(this.tripData.end_date).toDateString(),
      destination: this.tripData.destination_city_id.toString(),
      tripName: this.tripData.name.toString(),
      description: this.tripData.description.toString()
    };
  }

  loadingExpenses: boolean = false;
  expenseSplits: ExpenseSplit[] = [];
  typedUserId: string = '';
  activeTab = 'destinace'; 
  groupId = 'd516';
  newOwnerId: string = '';
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];
  expenses: any[] = [];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  leaveTrip() : void {
    //todo
    return;
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
    

  goBack(): void {
    console.log('Zpět');
  }

  addExpense(): void {
    console.log('Přidat výdaj');
  }

  showUsedCurrency(currency: string) {
    console.log('Showing used names for currency:', currency);
  }

  deleteExpense(expense_id: number): void {
    if (confirm('Opravdu chcete smazat tento výdaj?')) {
      this.expenseService.deleteExpense(expense_id).subscribe({
        next: () => {
          console.log('Expense deleted successfully');
          this.expenses = this.expenses.filter(e => e.expense_id !== expense_id);
          this.loadExpenses(this.tripData.id);
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
        }
      });
    }
  }
}