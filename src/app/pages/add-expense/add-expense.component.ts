import { Component, OnInit } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpenseService, ExpenseCategory, Expense, Currency, CreateMultipleExpenseSplitsRequest } from '../../services/finance-service.service';
import { TripMemberService, TripMember } from '../../services/trip-member.service';
import { Trip, TripService } from '../../services/trip-service.service';
import { User, UserService } from '../../services/user-service.service';
import { forkJoin, catchError, of, switchMap, map } from 'rxjs';
import { AbstractControl } from '@angular/forms';

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
  
  expenseType: 'personal' | 'shared' = 'personal';
  splitType: 'equal' | 'custom' = 'equal';
  userSplits: UserSplit[] = []; // Keep this for display purposes
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
      description: ['', Validators.maxLength(500)],
      userSplits: this.fb.array([]) // Add FormArray for user splits
    });

    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      if (this.expenseType === 'shared') {
        this.recalculateSplits();
      }
    });

    this.expenseForm.get('paidByUserId')?.valueChanges.subscribe((paidByUserId) => {
      if (this.expenseType === 'shared' && paidByUserId) {
        this.selectPayerInSplits(parseInt(paidByUserId));
      }
    });
  }

  // Getter for the FormArray
  get userSplitsFormArray(): FormArray {
    return this.expenseForm.get('userSplits') as FormArray;
  }

  onExpenseTypeChange(type: 'personal' | 'shared'): void {
    this.expenseType = type;
    this.clearErrors();
    
    if (type === 'shared') {
      this.initializeUserSplits();
      const paidByUserId = this.expenseForm.get('paidByUserId')?.value;
      if (paidByUserId) {
        this.selectPayerInSplits(parseInt(paidByUserId));
      }
      this.recalculateSplits();
    } else {
      this.userSplits = [];
      this.userSplitsFormArray.clear();
      this.isSettled = false;
    }
  }

  setIsSettled(settled: boolean): void {
    this.isSettled = settled;
  }

  private initializeUserSplits(): void {
    // Clear existing FormArray
    this.userSplitsFormArray.clear();
    
    // Initialize userSplits array and FormArray
    this.userSplits = this.users.map(user => ({
      userId: user.id,
      userName: user.name,
      amount: 0,
      selected: false
    }));

    // Add FormGroups to FormArray
    this.users.forEach(user => {
      const splitFormGroup = this.fb.group({
        userId: [user.id],
        userName: [user.name],
        amount: [0, [Validators.min(0)]],
        selected: [false]
      });
      this.userSplitsFormArray.push(splitFormGroup);
    });
  }

  private selectPayerInSplits(payerUserId: number): void {
    console.log('selectPayerInSplits called with payerUserId:', payerUserId);
    
    // Update both the display array and FormArray
    const payerIndex = this.userSplits.findIndex(split => split.userId === payerUserId);
    if (payerIndex !== -1) {
      this.userSplits[payerIndex].selected = true;
      this.userSplitsFormArray.at(payerIndex).patchValue({ selected: true });
      this.recalculateSplits();
    } else {
      console.warn('Payer not found for userId:', payerUserId);
    }
  }

  onSplitTypeChange(type: 'equal' | 'custom'): void {
    console.log('Split type changed to:', type);
    this.splitType = type;
    this.clearErrors();
    this.recalculateSplits();
  }

  onUserSelectionChange(): void {
    console.log('User selection changed.');
    this.clearErrors();
    
    // Sync FormArray values to display array
    this.userSplitsFormArray.controls.forEach((control, index) => {
      this.userSplits[index].selected = control.get('selected')?.value || false;
    });
    
    this.recalculateSplits();
  }

  selectAllUsers(): void {
    console.log('Selecting all users');
    this.userSplits.forEach((split, index) => {
      split.selected = true;
      this.userSplitsFormArray.at(index).patchValue({ selected: true });
    });
    this.onUserSelectionChange();
  }

  deselectAllUsers(): void {
    console.log('Deselecting all users');
    this.userSplits.forEach((split, index) => {
      split.selected = false;
      split.amount = 0;
      this.userSplitsFormArray.at(index).patchValue({ 
        selected: false, 
        amount: 0 
      });
    });
    this.clearErrors();
  }

  onCustomAmountChange(index: number): void {
    console.log('Custom amount changed for index:', index);
    if (this.splitType === 'custom') {
      const formControl = this.userSplitsFormArray.at(index);
      const isSelected = formControl.get('selected')?.value;
      const amount = formControl.get('amount')?.value || 0;
      
      if (!isSelected) {
        formControl.patchValue({ amount: 0 });
        this.userSplits[index].amount = 0;
      } else {
        this.userSplits[index].amount = amount;
      }
    }
  }

  private recalculateSplits(): void {
    console.log('Recalculating splits. Expense type:', this.expenseType);
    if (this.expenseType !== 'shared') {
      console.log('Not shared expense — skipping recalculation.');
      return;
    }

    const selectedUsers = this.userSplits.filter(split => split.selected);
    const totalAmount = this.expenseForm.get('amount')?.value || 0;

    console.log('Selected users:', selectedUsers);
    console.log('Total amount:', totalAmount);

    if (selectedUsers.length === 0 || totalAmount <= 0) {
      console.warn('No users selected or total amount <= 0. Resetting all amounts to 0.');
      this.userSplits.forEach((split, index) => {
        split.amount = 0;
        this.userSplitsFormArray.at(index).patchValue({ amount: 0 });
      });
      return;
    }

    if (this.splitType === 'equal') {
      console.log('Splitting equally...');
      this.calculateEqualSplits(selectedUsers, totalAmount);
    } else {
      console.log('Custom split — zeroing out unselected users');
      this.userSplits.forEach((split, index) => {
        if (!split.selected) {
          split.amount = 0;
          this.userSplitsFormArray.at(index).patchValue({ amount: 0 });
        }
      });
    }
  }

  private calculateEqualSplits(selectedUsers: UserSplit[], totalAmount: number): void {
    const baseAmount = Math.floor((totalAmount * 100) / selectedUsers.length) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * selectedUsers.length)) * 100) / 100;

    // Reset all amounts
    this.userSplits.forEach((split, index) => {
      split.amount = 0;
      this.userSplitsFormArray.at(index).patchValue({ amount: 0 });
    });

    // Calculate equal splits
    let firstSelectedIndex = -1;
    selectedUsers.forEach((split, splitIndex) => {
      const userIndex = this.userSplits.findIndex(u => u.userId === split.userId);
      if (userIndex !== -1) {
        let amount = baseAmount;
        if (splitIndex === 0 && remainder > 0) {
          amount = Math.round((amount + remainder) * 100) / 100;
        }
        
        this.userSplits[userIndex].amount = amount;
        this.userSplitsFormArray.at(userIndex).patchValue({ amount: amount });
      }
    });
  }

  private validateSplits(): boolean {
    if (this.expenseType === 'personal') {
      this.splitError = '';
      return true;
    }

    const selectedSplits = this.userSplits.filter(split => split.selected);
    const totalAmount = this.expenseForm.get('amount')?.value || 0;

    if (selectedSplits.length === 0) {
      this.splitError = 'Vyberte alespoň jednu osobu pro rozdělení výdaje.';
      return false;
    }

    if (totalAmount <= 0) {
      this.splitError = 'Zadejte platnou částku výdaje.';
      return false;
    }

    if (this.splitType === 'custom') {
      for (const split of selectedSplits) {
        if (!split.amount || split.amount <= 0) {
          this.splitError = `Zadejte platnou částku pro uživatele ${split.userName}.`;
          return false;
        }
      }
    }

    const totalSplitAmount = this.getTotalSplitAmount();
    const difference = Math.abs(totalSplitAmount - totalAmount);

    if (difference > 0.01) {
      this.splitError = `Součet rozdělených částek (${totalSplitAmount.toFixed(2)}) se neshoduje s celkovou částkou (${totalAmount.toFixed(2)}).`;
      return false;
    }

    this.splitError = '';
    return true;
  }

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

  onSubmit(): void {
    this.clearErrors();
    this.successMessage = '';

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.errorMessage = 'Prosím vyplňte všechna povinná pole.';
      return;
    }

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

      if (this.expenseType === 'shared' && this.users.length > 0) {
        this.initializeUserSplits();
        const paidByUserId = this.expenseForm.get('paidByUserId')?.value;
        if (paidByUserId) {
          this.selectPayerInSplits(parseInt(paidByUserId));
        }
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

trackByUserId(index: number, control: AbstractControl): any {
  return control.get('userId')?.value;
}
}