import { Component, OnInit } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpenseService, ExpenseCategory, Expense, Currency } from '../../services/finance-service.service';
import { TripMemberService, TripMember } from '../../services/trip-member.service';
import { Trip, TripService } from '../../services/trip-service.service';
import { User, UserService } from '../../services/user-service.service';
import { forkJoin, catchError, of, switchMap, map } from 'rxjs';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    ItinerarySidebarComponent,
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss'
})
export class AddExpenseComponent implements OnInit {
  expenseForm!: FormGroup;
  categories: ExpenseCategory[] = [];
  users: User[] = [];
  tripMembers: TripMember[] = [];
  currencies: Currency[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  tripId: number = 0;
  currentTrip?: Trip;
  isSubmitting: boolean = false;
  isSettled: boolean = false;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private tripService: TripService,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currencies = this.expenseService.getAllCurrencies();
  }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const tripIdParam = params.get('tripId');
      if (tripIdParam) {
        this.tripId = +tripIdParam;
        this.loadData();
      } else {
        this.errorMessage = 'No trip ID provided';
      }
    });
  }

  private initForm(): void {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      categoryId: ['', Validators.required],
      paidByUserId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['CZK', Validators.required],
      description: ['', Validators.maxLength(500)]
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isSubmitting = true;
    const formValue = this.expenseForm.value;

    const expense: Expense = {
      id: 0,
      name: formValue.name,
      trip_Id: this.tripId,
      category_Id: parseInt(formValue.categoryId),
      paid_by_user_id: parseInt(formValue.paidByUserId),
      amount: parseFloat(formValue.amount),
      currency_Code: formValue.currency,
      description: formValue.description || '',
      date: new Date(),
      //isSettled: this.isSettled
    };

    this.expenseService.createExpense(expense)
      .subscribe({
        next: (createdExpense) => {
          this.handleSuccess();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = 'Error creating expense: ' +
            (error.error?.message || error.message || 'Unknown error');
          console.error('Full backend error response:', error);
        }
      });
  }

  private handleSuccess(message: string = 'Expense added successfully!'): void {
    this.isSubmitting = false;
    this.successMessage = message;

    setTimeout(() => {
      this.router.navigate(['/trip-itinerary', this.tripId]);
    }, 100);
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading data for trip ID:', this.tripId);

    // First get the trip and categories
    forkJoin({
      trip: this.tripService.getTripById(this.tripId),
      categories: this.expenseService.getAllCategories()
    }).pipe(
      // If those succeed, then get the trip members
      switchMap(initialData => {
        this.currentTrip = initialData.trip;
        this.categories = initialData.categories;

        // Get trip members
        return this.tripMemberService.getMembersByTripId(this.tripId).pipe(
          // For each trip member, get the user details
          switchMap(members => {
            this.tripMembers = members;

            if (members.length === 0) {
              return of([]);
            }

            // Create an array of user detail requests
            const userRequests = members.map(member =>
              this.userService.getUserById(member.user_id)
            );

            // Run all user requests in parallel
            return forkJoin(userRequests);
          }),
          // Return both the initial data and the users
          map(users => ({
            ...initialData,
            users
          }))
        );
      }),
      catchError(error => {
        console.error('Error loading data', error);
        this.errorMessage = 'Failed to load data: ' + (error.message || 'Unknown error');
        this.isLoading = false;
        return of({ trip: undefined, categories: [], users: [] });
      })
    ).subscribe(result => {
      console.log('Loaded data:', result);

      this.users = result.users;

      if (this.users.length === 0) {
        this.errorMessage = 'No users found for this trip.';
      }

      if (this.categories.length === 0) {
        this.errorMessage = 'No expense categories found.';
      }

      this.isLoading = false;
    });
  }

  goBack(): void {
    if (!this.tripId) {
      console.error('Trip ID not available to navigate back.');
      return;
    }
    this.router.navigate(['/trip-itinerary', this.tripId]);
  }
  setIsSettled(value: boolean): void {
    this.isSettled = value;
  }

}