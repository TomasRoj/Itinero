import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseSplit, ExpenseCategory } from '../../../../services/finance-service.service';
import { ActivatedRoute } from '@angular/router';
import { ExpenseService } from '../../../../services/finance-service.service';
import { TripMemberService } from '../../../../services/trip-member.service';
import { TripService, Trip } from '../../../../services/trip-service.service';
import { TripMember } from '../../../../services/trip-member.service';
import { HttpClient } from '@angular/common/http';
import { User, UserService } from '../../../../services/user-service.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-finance-tab',
  imports: [CommonModule, RouterLink],
  templateUrl: './finance-tab.component.html',
  styleUrl: './finance-tab.component.scss'
})
export class FinanceTabComponent {
  
  loadingExpenses = false;
  loadingCategories = false;
  loadingUsers = false;
  expenseSplits: ExpenseSplit[] = [];
  expenseCategories: ExpenseCategory[] = [];
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];
  users: { [key: number]: User } = {}; // Store users by ID for easy lookup
  expenses: any[] = [];
  trip: Trip | null = null;
  tripData: any = null;
  expandedExpenseId: number | null = null;

  constructor (
    private expenseService: ExpenseService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      this.loadTripMembers(tripId);
      this.loadExpenses(tripId);
      this.loadExpenseCategories();
      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.trip = response;
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
  }

  /**
   * Load expense categories from the service
   */
  loadExpenseCategories(): void {
    this.loadingCategories = true;
    this.expenseService.getAllCategories().subscribe({
      next: (categories: ExpenseCategory[]) => {
        this.expenseCategories = categories;
        this.loadingCategories = false;
        console.log('Expense categories loaded:', categories);
      },
      error: (error: any) => {
        console.error('Error loading expense categories:', error);
        this.loadingCategories = false;
      }
    });
  }

  /**
   * Load user information for a specific user ID
   */
  loadUserById(userId: number): void {
    // Check if user is already loaded
    if (this.users[userId]) {
      return;
    }

    this.loadingUsers = true;
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.users[userId] = user;
        this.loadingUsers = false;
        console.log('User loaded:', user);
      },
      error: (error: any) => {
        console.error('Error loading user:', error);
        this.loadingUsers = false;
      }
    });
  }

  /**
   * Load multiple users by their IDs
   */
  loadUsersByIds(userIds: number[]): void {
    this.loadingUsers = true;
    let loadedCount = 0;
    const totalUsers = userIds.length;

    userIds.forEach(userId => {
      // Skip if user is already loaded
      if (this.users[userId]) {
        loadedCount++;
        if (loadedCount === totalUsers) {
          this.loadingUsers = false;
        }
        return;
      }

      this.userService.getUserById(userId).subscribe({
        next: (user: User) => {
          this.users[userId] = user;
          loadedCount++;
          if (loadedCount === totalUsers) {
            this.loadingUsers = false;
          }
        },
        error: (error: any) => {
          console.error(`Error loading user ${userId}:`, error);
          loadedCount++;
          if (loadedCount === totalUsers) {
            this.loadingUsers = false;
          }
        }
      });
    });
  }

  /**
   * Get user name by ID (helper method)
   */
  getUserName(userId: number): string {
    const user = this.users[userId];
    return user ? `${user.name} ${user.surname}` : 'Loading...';
  }

  /**
   * Get user email by ID (helper method)
   */
  getUserEmail(userId: number): string {
    const user = this.users[userId];
    return user ? user.email : '';
  }

  /**
   * Get category name by ID (helper method)
   */
  getCategoryName(categoryId: number): string {
    const category = this.expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  goToAddExpense(): void {
  const tripId = this.trip?.id;

  if (tripId == null) {
    console.error('Trip ID is not available yet.');
    return;
  }

  this.router.navigate(['/trip', tripId, 'expenses', 'add']);
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
 toggleExpenseDetails(expenseId: number): void {
    this.expandedExpenseId = this.expandedExpenseId === expenseId ? null : expenseId;
  }

  toggleSettlement(expenseId: number): void {
    const expense = this.expenses.find(e => e.id === expenseId);
    if (expense) {
      expense.isSettled = !expense.isSettled;
      
      // Call your service to update the backend
      // Example:
      // this.expenseService.updateExpenseSettlement(expenseId, expense.isSettled).subscribe({
      //   next: () => {
      //     console.log(`Expense ${expenseId} settlement updated to: ${expense.isSettled}`);
      //   },
      //   error: (error) => {
      //     console.error('Error updating settlement status:', error);
      //     // Revert the change on error
      //     expense.isSettled = !expense.isSettled;
      //   }
      // });
      
      console.log(`Expense ${expenseId} settlement status changed to: ${expense.isSettled}`);
    }
  }

    getSettledCount(): number {
    return this.expenses.filter(expense => expense.isSettled).length;
  }

  getPendingCount(): number {
    return this.expenses.filter(expense => !expense.isSettled).length;
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
          const isSettled = Math.random() > 0.5; // asi můžem smazat
          return {
            id: expense.id,
            description: expense.name || expense.description || 'Unnamed Expense',
            paidByUserId: expense.paid_by_user_id,
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

deleteExpense(expense_id: number): void { //have to referesh page before it displays right trips
  if (confirm('Opravdu chcete smazat tento výdaj?')) {
    this.expenseService.deleteExpense(expense_id).subscribe({
      next: (res) => {
        console.log('Expense deleted successfully:', res);
        if (this.trip?.id) {
          this.loadExpenses(this.trip.id);
        } else {
          console.error('trip.id is missing when trying to reload');
        }
      },
      error: (error) => {
        console.error('Error deleting expense:', error);
      }
    });
  }
  }
}
