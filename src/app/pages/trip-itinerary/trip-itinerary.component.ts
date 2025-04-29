import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';
import { Expense, ExpenseService, ExpenseSplit, User, ExpenseCategory } from '../../services/finance-service.service';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user-service.service'; // You'll need to create this service

@Component({
  selector: 'app-trip-itinerary',
  standalone: true,
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, FormsModule],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent implements OnInit {

  tripData: Trip | null = null;
  tripId: number = 0;
  expenses: Expense[] = [];
  expenseSplits: ExpenseSplit[] = [];
  expenseCategories: ExpenseCategory[] = [];
  groupMembers: User[] = [];
  isLoading: boolean = false;
  activeTab = 'destinace'; // Default tab
  
  // For the expense modal
  newExpense: Expense = this.createEmptyExpense();
  selectedUsers: number[] = [];
  splitEqual: boolean = true;
  customSplits: {userId: number, amount: number}[] = [];
  
  // UI control
  openDropdowns = new Set<string>();
  showAddExpenseModal: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private expenseService: ExpenseService,
    private userService: UserService // This will need to be created
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = +params['id'];
      this.loadTripData();
      this.loadExpenses();
      this.loadExpenseCategories();
      this.loadTripMembers();
    });
  }

  loadTripData(): void {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (response: Trip) => {
        this.tripData = response;
        this.updateFormPlaceholders();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading trip data:', error);
        this.isLoading = false;
      }
    });
  }

  loadExpenses(): void {
    this.expenseService.getExpensesByTripId(this.tripId).subscribe({
      next: (expenses: Expense[]) => {
        this.expenses = expenses;
        this.loadExpenseSplits();
      },
      error: (error: any) => {
        console.error('Error loading expenses:', error);
      }
    });
  }

  loadExpenseSplits(): void {
    this.expenseService.getSplitsByTripId(this.tripId).subscribe({
      next: (splits: ExpenseSplit[]) => {
        this.expenseSplits = splits;
      },
      error: (error: any) => {
        console.error('Error loading expense splits:', error);
      }
    });
  }

  loadExpenseCategories(): void {
    this.expenseService.getAllCategories().subscribe({
      next: (categories: ExpenseCategory[]) => {
        this.expenseCategories = categories;
      },
      error: (error: any) => {
        console.error('Error loading expense categories:', error);
      }
    });
  }

  loadTripMembers(): void {
    // This would be implemented in your UserService
    this.userService.getTripMembers(this.tripId).subscribe({
      next: (users: User[]) => {
        this.groupMembers = users;
      },
      error: (error: any) => {
        console.error('Error loading trip members:', error);
      }
    });
  }

  updateFormPlaceholders(): void {
    if (!this.tripData) return;
    
    const startDate = document.getElementById('startDate') as HTMLInputElement;
    const endDate = document.getElementById('endDate') as HTMLInputElement;
    const destination = document.getElementById('destinationName') as HTMLInputElement;
    const tripName = document.getElementById('tripName') as HTMLInputElement;
    const description = document.getElementById('descriptionField') as HTMLInputElement;

    if (startDate) startDate.placeholder = new Date(this.tripData.start_date).toDateString();
    if (endDate) endDate.placeholder = new Date(this.tripData.end_date).toDateString();
    if (destination) destination.placeholder = this.tripData.destination_city_id.toString();
    if (tripName) tripName.placeholder = this.tripData.name.toString();
    if (description) description.placeholder = this.tripData.description?.toString() || '';
  }

  updateTripData(): void {
    if (!this.tripData) return;
    
    const startDate = document.getElementById('startDate') as HTMLInputElement;
    const endDate = document.getElementById('endDate') as HTMLInputElement;
    const destination = document.getElementById('destinationName') as HTMLInputElement;
    const tripName = document.getElementById('tripName') as HTMLInputElement;
    const description = document.getElementById('descriptionField') as HTMLInputElement;
    
    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: tripName.value || this.tripData.name,
      destination_city_id: this.tripData.destination_city_id,
      start_date: new Date(startDate.value) || this.tripData.start_date,
      end_date: new Date(endDate.value) || this.tripData.end_date,
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: description.value || this.tripData.description
    };

    this.tripService.updateTrip(this.tripId, updatedTrip).subscribe({
      next: (response) => {
        console.log('Trip updated successfully:', response);
        // Show success message
        alert('Trip was updated successfully!');
        this.loadTripData();
      },
      error: (error) => {
        console.error('Error updating trip:', error);
        alert('Failed to update trip. Please try again.');
      }
    });
  }

  // Expense Management
  openAddExpenseModal(): void {
    this.newExpense = this.createEmptyExpense();
    this.selectedUsers = this.groupMembers.map(member => member.id);
    this.splitEqual = true;
    this.showAddExpenseModal = true;
  }

  closeAddExpenseModal(): void {
    this.showAddExpenseModal = false;
  }

  createEmptyExpense(): Expense {
    return {
      name: '',
      tripId: this.tripId,
      paidByUserId: this.tripData?.creator_id || 0,
      amount: 0,
      currencyCode: 'CZK',
      description: '',
      date: new Date()
    };
  }

  addExpense(): void {
    if (!this.newExpense.name || this.newExpense.amount <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    // Set current dates
    this.newExpense.createdAt = new Date();
    this.newExpense.updatedAt = new Date();
    
    this.expenseService.createExpense(this.newExpense).subscribe({
      next: (createdExpense: Expense) => {
        console.log('Expense created:', createdExpense);
        
        // Create expense splits if needed
        if (this.selectedUsers.length > 0) {
          this.createExpenseSplits(createdExpense.id!);
        } else {
          this.closeAddExpenseModal();
          this.loadExpenses();
        }
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        alert('Failed to add expense. Please try again.');
      }
    });
  }

  createExpenseSplits(expenseId: number): void {
    let splitsToCreate = this.selectedUsers.length;
    let createdSplits = 0;
    
    if (this.splitEqual) {
      const equalAmount = this.newExpense.amount / this.selectedUsers.length;
      
      this.selectedUsers.forEach(userId => {
        const split: ExpenseSplit = {
          expenseId: expenseId,
          userId: userId,
          amount: equalAmount,
          isSettled: false,
          tripId: this.tripId
        };
        
        this.expenseService.createExpenseSplit(split).subscribe({
          next: () => {
            createdSplits++;
            if (createdSplits === splitsToCreate) {
              this.closeAddExpenseModal();
              this.loadExpenses();
            }
          },
          error: (error) => {
            console.error('Error creating expense split:', error);
          }
        });
      });
    } else {
      // Handle custom splits
      this.customSplits.forEach(split => {
        if (split.amount > 0) {
          const expenseSplit: ExpenseSplit = {
            expenseId: expenseId,
            userId: split.userId,
            amount: split.amount,
            isSettled: false,
            tripId: this.tripId
          };
          
          this.expenseService.createExpenseSplit(expenseSplit).subscribe({
            next: () => {
              createdSplits++;
              if (createdSplits === splitsToCreate) {
                this.closeAddExpenseModal();
                this.loadExpenses();
              }
            },
            error: (error) => {
              console.error('Error creating expense split:', error);
            }
          });
        }
      });
    }
  }

  deleteExpense(expenseId: number): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.expenseService.deleteExpense(expenseId).subscribe({
        next: () => {
          console.log('Expense deleted successfully');
          this.loadExpenses();
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          alert('Failed to delete expense. Please try again.');
        }
      });
    }
  }

  viewExpenseDetails(expenseId: number): void {
    // Navigate to expense details page or open modal
    console.log('View expense details for:', expenseId);
  }

  // UI Helpers
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleDropdown(dropdownName: string) {
    if (this.openDropdowns.has(dropdownName)) {
      this.openDropdowns.delete(dropdownName);
    } else {
      this.openDropdowns.add(dropdownName);
    }
  }

  isDropdownOpen(dropdownName: string): boolean {
    return this.openDropdowns.has(dropdownName);
  }

  getUserName(userId: number): string {
    const user = this.groupMembers.find(user => user.id === userId);
    return user ? user.name : 'Unknown User';
  }

  isExpenseSettled(expenseId: number): boolean {
    const splits = this.expenseSplits.filter(split => split.expenseId === expenseId);
    return splits.length > 0 && splits.every(split => split.isSettled);
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  // For backward compatibility
  transferOwnership(): void {
    console.log('Transfer ownership');
  }

  removeUser(id: any) {
    console.log('Removing user:', id);
  }

  goBack(): void {
    this.router.navigate(['/trips']);
  }
}