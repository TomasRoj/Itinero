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
  //#region Fields
  loadingExpenses = false;
  loadingCategories = false;
  loadingUsers = false;
  loadingSplits = false;
  expenseSplits: ExpenseSplit[] = [];
  expenseCategories: ExpenseCategory[] = [];
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];
  users: { [key: number]: User } = {};
  expenses: any[] = [];
  expenseSplitsMap: { [expenseId: number]: ExpenseSplit[] } = {};
  trip: Trip | null = null;
  tripData: any = null;
  expandedExpenseId: number | null = null;
  //#endregion

  //#region Constructor
  constructor (
    private expenseService: ExpenseService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      this.loadTripData(tripId);
    });
  }
  //#endregion

  //#region Load Trip Data and Members
  private loadTripData(tripId: number): void {
    this.tripService.getTripById(tripId).subscribe({
      next: (response: Trip) => {
        this.trip = response;
        this.tripData = response;
        this.loadTripMembers(tripId);
        this.loadExpenseCategories();
        this.loadExpensesWithDetails(tripId);
      },
      error: (error: any) => {
        console.error('Error loading trip data:', error);
      }
    });
  }

  loadTripMembers(tripId: number): void {
    this.tripMemberService.getMembersByTripId(tripId).subscribe({
      next: (members: TripMember[]) => {
        this.groupMembers = [];
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
  //#endregion

  //#region Load Expense Categories
  loadExpenseCategories(): void {
    this.loadingCategories = true;
    this.expenseService.getAllCategories().subscribe({
      next: (categories: ExpenseCategory[]) => {
        this.expenseCategories = categories;
        this.loadingCategories = false;
      },
      error: (error: any) => {
        console.error('Error loading expense categories:', error);
        this.loadingCategories = false;
      }
    });
  }
  //#endregion

  //#region Load Expenses and Related Data

private loadExpensesWithDetails(tripId: number): void {
  this.loadingExpenses = true;
  this.expenses = [];
  
  this.expenseService.getExpensesByTripId(tripId).subscribe({
    next: (expensesData: Expense[]) => {
      if (!expensesData || expensesData.length === 0) {
        this.loadingExpenses = false;
        return;
      }
      
      const userIds = new Set<number>();
      this.expenses = expensesData.map(expense => {
        userIds.add(expense.paid_by_user_id);
        return {
          id: expense.id,
          name: expense.name,
          description: expense.description || expense.name || 'Unnamed Expense',
          paidByUserId: expense.paid_by_user_id,
          date: expense.date,
          amount: expense.amount,
          currency: expense.currency_Code,
          category_Id: expense.category_Id,
          receipt_image: expense.receipt_image,
          createdAt: expense.created_At,
          isSettled: false // Will be calculated from splits
        };
      });
      
      this.loadUsersAndSplits(Array.from(userIds), expensesData.map(e => e.id));
    },
    error: (error) => {
      console.error('Error loading expenses:', error);
      this.loadingExpenses = false;
    }
  });
}

  private loadUsersAndSplits(userIds: number[], expenseIds: number[]): void {
    const userRequests = userIds.map(id => this.userService.getUserById(id));
    const splitRequests = expenseIds.map(id => this.expenseService.getSplitsByExpenseId(id));

    if (userRequests.length > 0) {
      this.loadingUsers = true;
      forkJoin(userRequests).subscribe({
        next: (users: User[]) => {
          users.forEach(user => {
            this.users[user.id] = user;
          });
          this.loadingUsers = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.loadingUsers = false;
        }
      });
    }

    if (splitRequests.length > 0) {
      this.loadingSplits = true;
      forkJoin(splitRequests).subscribe({
        next: (allSplits: ExpenseSplit[][]) => {
          // First, populate the splits map completely and normalize the boolean values
          expenseIds.forEach((expenseId, index) => {
            const splits = allSplits[index] || [];
            // Normalize the is_settled field - convert null/undefined to false
            splits.forEach(split => {
              split.is_settled = split.is_settled === true; // Convert to proper boolean
            });
            this.expenseSplitsMap[expenseId] = splits;
          });
          
          // Debug: Log the splits data
          console.log('Loaded splits data (after normalization):', this.expenseSplitsMap);
          
          // Now update settlement status from database
          this.updateExpenseSettlementStatusFromDatabase();
          
          // Debug: Log the settlement status after update
          console.log('Settlement status after update:', this.expenses.map(e => ({id: e.id, name: e.name, isSettled: e.isSettled})));
          
          const splitUserIds = new Set<number>();
          Object.values(this.expenseSplitsMap).forEach(splits => {
            splits.forEach(split => splitUserIds.add(split.user_Id));
          });
          const newUserIds = Array.from(splitUserIds).filter(id => !this.users[id]);
          if (newUserIds.length > 0) {
            this.loadUsersByIds(newUserIds);
          }
          this.loadingSplits = false;
          this.loadingExpenses = false;
        },
        error: (error) => {
          console.error('Error loading expense splits:', error);
          this.loadingSplits = false;
          this.loadingExpenses = false;
        }
      });
    } else {
      // If no splits to load, expenses remain with their default isSettled: false
      this.loadingExpenses = false;
    }
  }
  //#endregion

  //#region User Helpers
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
      },
      error: (error: any) => {
        console.error('Error loading additional users:', error);
        this.loadingUsers = false;
      }
    });
  }

  getUserName(userId: number): string {
    const user = this.users[userId];
    return user ? `${user.name} ${user.surname}` : 'Loading...';
  }

  getUserEmail(userId: number): string {
    const user = this.users[userId];
    return user ? user.email : '';
  }
  //#endregion

  //#region Expense Category Helpers
  getCategoryName(categoryId: number): string {
    if (!categoryId) return 'No Category';
    const category = this.expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }
  //#endregion

  //#region Expense Splits Helpers
  getExpenseCoPayerNames(expenseId: number): string {
    const splits = this.expenseSplitsMap[expenseId] || [];
    if (splits.length === 0) return 'No co-payers';
    const coPayerNames = splits.map(split => this.getUserName(split.user_Id));
    return coPayerNames.join(', ');
  } 

  getExpenseSplits(expenseId: number): ExpenseSplit[] {
    return this.expenseSplitsMap[expenseId] || [];
  }

  checkExpenseSplits(expenseId: number): void {
    this.expenseService.getSplitsByExpenseId(expenseId).subscribe({
      next: (splits) => {},
      error: () => {}
    });
  }
  //#endregion

  //#region Expense Details and UI
  toggleExpenseDetails(expenseId: number): void {
    this.expandedExpenseId = this.expandedExpenseId === expenseId ? null : expenseId;
  }

  goToEditExpense(expenseId: number, event?: MouseEvent): void {
  event?.stopPropagation();

  const tripId = this.trip?.id;
  if (tripId == null || expenseId == null) {
    return;
  }

this.router.navigate(['/trip', tripId, 'expenses', 'edit-expense', expenseId]);
}

  goToAddExpense(): void {
    const tripId = this.trip?.id;
    if (tripId == null) {
      return;
    }
    this.router.navigate(['/trip', tripId, 'expenses', 'add']);
  }
  //#endregion

  //#region Settlement Status Management
  getSettledCount(): number {
    return this.expenses.filter(expense => expense.isSettled).length;
  }

  getPendingCount(): number {
    return this.expenses.filter(expense => !expense.isSettled).length;
  }

  private updateExpenseSettlementStatusFromDatabase(): void {
  console.log('Updating settlement status from database...');
  this.expenses.forEach(expense => {
    const splits = this.expenseSplitsMap[expense.id] || [];
    
    if (splits.length === 0) {
      expense.isSettled = false;
    } else {
      // Check if ALL splits are settled
      // Handle both possible field names from backend
      const allSettled = splits.every(split => {
        const backendField = (split as any).Is_Settled;
        const frontendField = split.is_settled;
        return backendField === true || frontendField === true;
      });
      expense.isSettled = allSettled;
    }
    
    console.log(`Expense ${expense.id} (${expense.name}): ${expense.isSettled ? 'SETTLED' : 'NOT SETTLED'}`);
  });
}

  toggleSettlement(expenseId: number): void {
    const expense = this.expenses.find(e => e.id === expenseId);
    if (!expense) {
      return;
    }
    const splits = this.expenseSplitsMap[expenseId] || [];
    if (splits.length === 0) {
      alert('Chyba: Pro tento výdaj neexistují žádné rozdělení.');
      return;
    }
    const currentSettlementStatus = expense.isSettled;
    if (currentSettlementStatus) {
      this.expenseService.unsettleExpenseSplits(expenseId).subscribe({
        next: () => {
          splits.forEach(split => {
            split.is_settled = false;
            split.settled_At = undefined;
          });
          expense.isSettled = false;
        },
        error: (error) => {
          alert('Nepodařilo se zrušit vyrovnání výdaje: ' + (error.error || error.message));
        }
      });
    } else {
      this.expenseService.settleExpenseSplits(expenseId).subscribe({
        next: () => {
          splits.forEach(split => {
            split.is_settled = true;
            split.settled_At = new Date();
          });
          expense.isSettled = true;
        },
        error: (error) => {
          alert('Nepodařilo se vyrovnat výdaj: ' + (error.error || error.message));
        }
      });
    }
  }
  //#endregion

  //#region Expense Refresh
  refreshExpenseData(expenseId: number): void {
    this.expenseService.getSplitsByExpenseId(expenseId).subscribe({
      next: (splits: ExpenseSplit[]) => {
        this.expenseSplitsMap[expenseId] = splits;
        this.updateExpenseSettlementStatusFromDatabase();
      },
      error: (error) => {
        console.error('Error refreshing expense data:', error);
      }
    });
  }
  //#endregion

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