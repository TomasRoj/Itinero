import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseSplit } from '../../../../services/finance-service.service';
import { ActivatedRoute } from '@angular/router';
import { ExpenseService } from '../../../../services/finance-service.service';
import { TripMemberService } from '../../../../services/trip-member.service';
import { TripService, Trip } from '../../../../services/trip-service.service';
import { TripMember } from '../../../../services/trip-member.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../../services/user-service.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-finance-tab',
  imports: [CommonModule, RouterLink],
  templateUrl: './finance-tab.component.html',
  styleUrl: './finance-tab.component.scss'
})
export class FinanceTabComponent {
  
  loadingExpenses: boolean = false;
  expenseSplits: ExpenseSplit[] = [];
  groupMembers: { id: number, name: string, role: string, avatar: string, userId: number, email?: string }[] = [];
  expenses: any[] = [];
  trip: Trip | null = null;
  tripData: any = null;

  constructor (
    private expenseService: ExpenseService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private tripMemberService: TripMemberService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      this.loadTripMembers(tripId);
      this.loadExpenses(tripId);

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
