import { Component, OnInit } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpenseService, ExpenseCategory, Expense, Currency, CreateMultipleExpenseSplitsRequest } from '../../services/finance-service.service';
import { TripMemberService, TripMember } from '../../services/trip-member.service';
import { Trip, TripService } from '../../services/trip-service.service';
import { User, UserService } from '../../services/user-service.service';
import { forkJoin, catchError, of, switchMap, map } from 'rxjs';

interface UserSplit {
  userId: number;
  userName: string;
  amount: number;
  selected: boolean;
}

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
  submitted: boolean = false;
  
  // Expense type and splitting
  expenseType: 'personal' | 'shared' = 'personal';
  splitType: 'equal' | 'custom' = 'equal';
  userSplits: UserSplit[] = [];
  splitError: string = '';
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

    // Watch for amount changes to recalculate splits
    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      if (this.expenseType === 'shared') {
        this.recalculateSplits();
      }
    });
  }

  // === EXPENSE TYPE MANAGEMENT ===
  onExpenseTypeChange(type: 'personal' | 'shared'): void {
    this.expenseType = type;
    this.clearErrors();
    
    if (type === 'shared') {
      this.initializeUserSplits();
      this.recalculateSplits();
    } else {
      this.userSplits = [];
      this.isSettled = false;
    }
  }

  // === SETTLEMENT STATUS MANAGEMENT ===
  setIsSettled(settled: boolean): void {
    this.isSettled = settled;
  }

  // === USER SPLITS INITIALIZATION ===
  private initializeUserSplits(): void {
    this.userSplits = this.users.map(user => ({
      userId: user.id,
      userName: user.name,
      amount: 0,
      selected: true
    }));
      this.recalculateSplits();
  }

  // === SPLIT TYPE MANAGEMENT ===
  onSplitTypeChange(type: 'equal' | 'custom'): void {
    this.splitType = type;
    this.clearErrors();
    this.recalculateSplits();
  }

  // === USER SELECTION MANAGEMENT ===
  onUserSelectionChange(): void {
    this.clearErrors();
    this.recalculateSplits();
  }

  selectAllUsers(): void {
    this.userSplits.forEach(split => split.selected = true);
    this.onUserSelectionChange();
  }

  deselectAllUsers(): void {
    this.userSplits.forEach(split => {
      split.selected = false;
      split.amount = 0;
    });
    this.clearErrors();
  }

  // === AMOUNT MANAGEMENT ===
  onCustomAmountChange(): void {
    if (this.splitType === 'custom') {
      // Ensure non-selected users have 0 amount
      this.userSplits.forEach(split => {
        if (!split.selected) {
          split.amount = 0;
        }
      });
      // Only validate on submit, not during typing
    }
  }

  // === SPLIT CALCULATION ===
  private recalculateSplits(): void {
    if (this.expenseType !== 'shared') {
      return;
    }

    const selectedUsers = this.userSplits.filter(split => split.selected);
    const totalAmount = this.expenseForm.get('amount')?.value || 0;

    if (selectedUsers.length === 0 || totalAmount <= 0) {
      this.userSplits.forEach(split => split.amount = 0);
      return;
    }

    if (this.splitType === 'equal') {
      this.calculateEqualSplits(selectedUsers, totalAmount);
    } else {
      // For custom splits, only reset non-selected users to 0
      this.userSplits.forEach(split => {
        if (!split.selected) {
          split.amount = 0;
        }
      });
    }
  }

  private calculateEqualSplits(selectedUsers: UserSplit[], totalAmount: number): void {
    const baseAmount = Math.floor((totalAmount * 100) / selectedUsers.length) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * selectedUsers.length)) * 100) / 100;

    // Reset all amounts first
    this.userSplits.forEach(split => split.amount = 0);

    // Assign base amounts to selected users
    selectedUsers.forEach((split, index) => {
      split.amount = baseAmount;
      // Add remainder to the first user to handle rounding
      if (index === 0 && remainder > 0) {
        split.amount = Math.round((split.amount + remainder) * 100) / 100;
      }
    });
  }

  // === VALIDATION ===
  private validateSplits(): boolean {
    if (this.expenseType === 'personal') {
      this.splitError = '';
      return true;
    }

    const selectedSplits = this.userSplits.filter(split => split.selected);
    const totalAmount = this.expenseForm.get('amount')?.value || 0;

    // Check if at least one user is selected
    if (selectedSplits.length === 0) {
      this.splitError = 'Vyberte alespoň jednu osobu pro rozdělení výdaje.';
      return false;
    }

    // Check if total amount is positive
    if (totalAmount <= 0) {
      this.splitError = 'Zadejte platnou částku výdaje.';
      return false;
    }

    // Check individual amounts for custom splits
    if (this.splitType === 'custom') {
      for (const split of selectedSplits) {
        if (!split.amount || split.amount <= 0) {
          this.splitError = `Zadejte platnou částku pro uživatele ${split.userName}.`;
          return false;
        }
      }
    }

    // Check if amounts match total
    const totalSplitAmount = this.getTotalSplitAmount();
    const difference = Math.abs(totalSplitAmount - totalAmount);

    if (difference > 0.01) {
      this.splitError = `Součet rozdělených částek (${totalSplitAmount.toFixed(2)}) se neshoduje s celkovou částkou (${totalAmount.toFixed(2)}).`;
      return false;
    }

    this.splitError = '';
    return true;
  }

  // === UTILITY METHODS ===
  getTotalSplitAmount(): number {
    return this.userSplits
      .filter(split => split.selected)
      .reduce((sum, split) => sum + (split.amount || 0), 0);
  }

  getSelectedUsersCount(): number {
    return this.userSplits.filter(split => split.selected).length;
  }

  getAbsoluteDifference(): number {
    return Math.abs((this.expenseForm.get('amount')?.value || 0) - this.getTotalSplitAmount());
  }

  isAmountMatching(): boolean {
    return this.getAbsoluteDifference() <= 0.01;
  }

  private clearErrors(): void {
    this.splitError = '';
    this.errorMessage = '';
  }

  // === FORM SUBMISSION ===
  onSubmit(): void {
    this.clearErrors();
    this.successMessage = '';

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.errorMessage = 'Prosím vyplňte všechna povinná pole.';
      return;
    }

    // Validate splits for shared expenses
    if (this.expenseType === 'shared' && !this.validateSplits()) {
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
    };

    this.expenseService.createExpense(expense)
      .pipe(
        switchMap(createdExpense => {
          if (this.expenseType === 'shared') {
            return this.createExpenseSplits(createdExpense.id);
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: () => {
          const message = this.expenseType === 'shared' 
            ? 'Výdaj byl úspěšně přidán včetně rozdělení!' 
            : 'Výdaj byl úspěšně přidán!';
          this.handleSuccess(message);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = 'Chyba při vytváření výdaje: ' + 
            (error.error?.message || error.message || 'Neznámá chyba');
          console.error('Full backend error response:', error);
        }
      });
  }

  private createExpenseSplits(expenseId: number) {
    const selectedSplits = this.userSplits.filter(split => split.selected && split.amount > 0);
    
    if (selectedSplits.length === 0) {
      throw new Error('Nebyli vybráni žádní uživatelé pro rozdělení výdaje.');
    }
    
    const request: CreateMultipleExpenseSplitsRequest = {
      userIds: selectedSplits.map(split => split.userId),
      totalAmount: this.expenseForm.get('amount')?.value,
      splitType: this.splitType,
      isSettled: this.isSettled
    };

    // Add user amounts for custom splits
    if (this.splitType === 'custom') {
      request.userAmounts = {};
      selectedSplits.forEach(split => {
        request.userAmounts![split.userId.toString()] = split.amount;
      });
    }
    
    return this.expenseService.createMultipleExpenseSplits(expenseId, request);
  }

  private handleSuccess(message: string = 'Výdaj byl úspěšně přidán!'): void {
    this.isSubmitting = false;
    this.successMessage = message;

    setTimeout(() => {
      this.router.navigate(['/trip-itinerary', this.tripId]);
    }, 100);
  }

  // === DATA LOADING ===
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading data for trip ID:', this.tripId);
    
    forkJoin({
      trip: this.tripService.getTripById(this.tripId),
      categories: this.expenseService.getAllCategories()
    }).pipe(
      switchMap(initialData => {
        this.currentTrip = initialData.trip;
        this.categories = initialData.categories;
        
        return this.tripMemberService.getMembersByTripId(this.tripId).pipe(
          switchMap(members => {
            this.tripMembers = members;

            if (members.length === 0) {
              return of([]);
            }
            
            const userRequests = members.map(member => 
              this.userService.getUserById(member.user_id)
            );
            
            return forkJoin(userRequests);
          }),
          map(users => ({
            ...initialData,
            users
          }))
        );
      }),
      catchError(error => {
        console.error('Error loading data', error);
        this.errorMessage = 'Nepodařilo se načíst data: ' + (error.message || 'Neznámá chyba');
        this.isLoading = false;
        return of({ trip: undefined, categories: [], users: [] });
      })
    ).subscribe(result => {
      console.log('Loaded data:', result);

      this.users = result.users;

      if (this.users.length === 0) {
        this.errorMessage = 'Pro tento výlet nebyli nalezeni žádní uživatelé.';
      }

      if (this.categories.length === 0) {
        this.errorMessage = 'Nebyly nalezeny žádné kategorie výdajů.';
      }
        this.expenseType = 'shared';

      // Initialize user splits when users are loaded
      if (this.expenseType === 'shared' && this.users.length > 0) {
        this.initializeUserSplits();
      }

      this.isLoading = false;
    });
  }

  // === NAVIGATION ===
  goBack(): void {
    if (!this.tripId) {
      console.error('Trip ID not available to navigate back.');
      return;
    }
    this.router.navigate(['/trip-itinerary', this.tripId]);
  }

  // === TRACKING ===
  trackByUserId(index: number, item: UserSplit): number {
    return item.userId;
  }
}