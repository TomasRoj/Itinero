import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseSplit, ExpenseCategory, Expense } from '../../../../services/finance-service.service';
import { ActivatedRoute } from '@angular/router';
import { ExpenseService } from '../../../../services/finance-service.service';
import { TripMemberService } from '../../../../services/trip-member.service';
import { TripService, Trip } from '../../../../services/trip-service.service';
import { TripMember } from '../../../../services/trip-member.service';
import { HttpClient } from '@angular/common/http';
import { User, UserService } from '../../../../services/user-service.service';
import { RouterLink, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
  loadingSplits = false;
  expenseSplits: ExpenseSplit[] = [];
  expenseCategories: ExpenseCategory[] = [];
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];
  users: { [key: number]: User } = {}; // Store users by ID for easy lookup
  expenses: any[] = [];
  // Store splits grouped by expense ID for easy lookup
  expenseSplitsMap: { [expenseId: number]: ExpenseSplit[] } = {};
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
      this.loadTripData(tripId);
    });
  }

  /**
   * Load all trip-related data in the correct order
   */
  private loadTripData(tripId: number): void {
    // First load the trip details
    this.tripService.getTripById(tripId).subscribe({
      next: (response: Trip) => {
        this.trip = response;
        this.tripData = response;
        
        // Then load all other data
        this.loadTripMembers(tripId);
        this.loadExpenseCategories();
        this.loadExpensesWithDetails(tripId);
      },
      error: (error: any) => {
        console.error('Error loading trip data:', error);
      }
    });
  }

  /**
   * Load expenses and their related data (users, splits)
   */
  private loadExpensesWithDetails(tripId: number): void {
    this.loadingExpenses = true;
    this.expenses = [];

    this.expenseService.getExpensesByTripId(tripId).subscribe({
      next: (expensesData: Expense[]) => {
        console.log('Raw expenses data:', expensesData);

        if (!expensesData || expensesData.length === 0) {
          console.log('No expenses found for this trip');
          this.loadingExpenses = false;
          return;
        }

        // Process expenses and get unique user IDs
        const userIds = new Set<number>();
        
        this.expenses = expensesData.map(expense => {
          userIds.add(expense.paid_by_user_id);
          
          return {
            id: expense.id,
            name: expense.name,
            description: expense.name || expense.description || 'Unnamed Expense',
            paidByUserId: expense.paid_by_user_id,
            date: expense.date,
            amount: expense.amount,
            currency: expense.currency_Code,
            category_Id: expense.category_Id,
            receipt_image: expense.receipt_image,
            createdAt: expense.created_At,
            isSettled: Math.random() > 0.5 // Replace with actual settlement logic
          };
        });

        // Load users and splits for all expenses
        this.loadUsersAndSplits(Array.from(userIds), expensesData.map(e => e.id));
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.loadingExpenses = false;
      }
    });
  }

  /**
   * Load users and expense splits in parallel
   */
  private loadUsersAndSplits(userIds: number[], expenseIds: number[]): void {
    const userRequests = userIds.map(id => this.userService.getUserById(id));
    const splitRequests = expenseIds.map(id => this.expenseService.getSplitsByExpenseId(id));

    // Load users
    if (userRequests.length > 0) {
      this.loadingUsers = true;
      forkJoin(userRequests).subscribe({
        next: (users: User[]) => {
          users.forEach(user => {
            this.users[user.id] = user;
          });
          this.loadingUsers = false;
          console.log('Users loaded:', this.users);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.loadingUsers = false;
        }
      });
    }

    // Load expense splits
    if (splitRequests.length > 0) {
      this.loadingSplits = true;
      forkJoin(splitRequests).subscribe({
        next: (allSplits: ExpenseSplit[][]) => {
          // Group splits by expense ID
          expenseIds.forEach((expenseId, index) => {
            this.expenseSplitsMap[expenseId] = allSplits[index] || [];
          });
          
          // Load users mentioned in splits
          const splitUserIds = new Set<number>();
          Object.values(this.expenseSplitsMap).forEach(splits => {
            splits.forEach(split => splitUserIds.add(split.user_Id));
          });

          // Load additional users from splits if not already loaded
          const newUserIds = Array.from(splitUserIds).filter(id => !this.users[id]);
          if (newUserIds.length > 0) {
            this.loadUsersByIds(newUserIds);
          }

          this.loadingSplits = false;
          this.loadingExpenses = false;
          console.log('Expense splits loaded:', this.expenseSplitsMap);
        },
        error: (error) => {
          console.error('Error loading expense splits:', error);
          this.loadingSplits = false;
          this.loadingExpenses = false;
        }
      });
    } else {
      this.loadingExpenses = false;
    }
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
   * Load multiple users by their IDs
   */
  loadUsersByIds(userIds: number[]): void {
    if (userIds.length === 0) return;

    this.loadingUsers = true;
    const userRequests = userIds.map(id => this.userService.getUserById(id));

    forkJoin(userRequests).subscribe({
      next: (users: User[]) => {
        users.forEach(user => {
          this.users[user.id] = user;
        });
        this.loadingUsers = false;
        console.log('Additional users loaded:', users);
      },
      error: (error: any) => {
        console.error('Error loading additional users:', error);
        this.loadingUsers = false;
      }
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
    if (!categoryId) return 'No Category';
    const category = this.expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  /**
   * Get co-payers for an expense (users who have splits for this expense)
   */
  getExpenseCoPayerNames(expenseId: number): string {
    const splits = this.expenseSplitsMap[expenseId] || [];
    if (splits.length === 0) return 'No co-payers';

    const coPayerNames = splits.map(split => this.getUserName(split.user_Id));
    return coPayerNames.join(', ');
  }

  /**
   * Get splits for a specific expense
   */
  getExpenseSplits(expenseId: number): ExpenseSplit[] {
    return this.expenseSplitsMap[expenseId] || [];
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

        // Load users for all members
        const memberUserIds = members.map(m => m.user_id);
        const userRequests = memberUserIds.map(id => this.userService.getUserById(id));

        if (userRequests.length > 0) {
          forkJoin(userRequests).subscribe({
            next: (users: User[]) => {
              users.forEach((user, index) => {
                const member = members[index];
                const isCreator = this.tripData && this.tripData.creator_id === user.id;
                this.groupMembers.push({
                  id: member.id || 0,
                  name: `${user.name} ${user.surname}`,
                  role: isCreator ? 'Vlastník' : (member.role || 'Member'),
                  avatar: user.profile_picture || 'assets/avatars/user1.jpg',
                  userId: user.id,
                  email: user.email
                });
              });
            },
            error: (error) => {
              console.error('Error loading member users:', error);
            }
          });
        }
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

  deleteExpense(expense_id: number): void {
    if (confirm('Opravdu chcete smazat tento výdaj?')) {
      this.expenseService.deleteExpense(expense_id).subscribe({
        next: (res) => {
          console.log('Expense deleted successfully:', res);
          if (this.trip?.id) {
            this.loadExpensesWithDetails(this.trip.id);
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