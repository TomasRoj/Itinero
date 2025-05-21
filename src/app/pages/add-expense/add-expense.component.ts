import { Component, OnInit } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpenseService, ExpenseCategory, ExpenseSplit, Expense, Currency } from '../../services/finance-service.service';
import { TripMemberService, TripMember } from '../../services/trip-member.service';
import { Trip, TripService } from '../../services/trip-service.service';
import { User, UserService } from '../../services/user-service.service';
import { forkJoin, catchError, of, switchMap, tap,map } from 'rxjs';

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
  isSettled: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  tripId: number = 0;
  currentTrip?: Trip;
  
  isFormValid: boolean = false;
  isTotalValid: boolean = true;
  isSubmitting: boolean = false;

  get userSplits(): FormArray {
    return this.expenseForm.get('userSplits') as FormArray;
  }
  
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
        this.errorMessage = 'No trip ID provided'; //getting this error
      }
    });

    this.expenseForm.valueChanges.subscribe(() => {
      this.isFormValid = this.validateForm();
      this.isTotalValid = this.validateTotals();
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
      isSettled: [false],
      userSplits: this.fb.array([])
    });

    this.expenseForm.get('amount')!.valueChanges.subscribe(() => {
      if (this.expenseForm.get('amount')!.valid) {
        this.recalculateSplits();
      }
    });
    
    this.expenseForm.get('currency')!.valueChanges.subscribe(() => {
      this.recalculateSplits();
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.validateForm()) {
      this.expenseForm.markAllAsTouched();
      
      if (!this.hasIncludedUsers()) {
        this.errorMessage = 'At least one user must be included in the expense.';
      } else if (!this.validateTotals()) {
        this.errorMessage = 'The split amounts must add up to the total expense amount.';
      } else {
        this.errorMessage = 'Please fill in all required fields.';
      }
      
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
      date: new Date()
    };
    
    const splits: ExpenseSplit[] = formValue.userSplits
      .filter((split: any) => split.included)
      .map((split: any) => ({
        expense_id: 0,
        user_Id: parseInt(split.userId),
        amount: parseFloat(split.amount),
        is_settled: formValue.isSettled,
        settled_At: formValue.isSettled ? new Date() : null,
        trip_Id: this.tripId
      }));

    this.expenseService.createExpenseWithSplits(expense, splits)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Expense added successfully!';
          
          setTimeout(() => {
            this.router.navigate(['/trip', this.tripId, 'expenses']);
          }, 1500);
        },
        error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Error creating expense: ' + (error.error?.message || error.message || 'Unknown error');
        console.error('Full backend error response:', error);
        }
      });
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
              this.userService.getUserById(member.user_id) //what does this do?
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
      
      if (this.users.length > 0) {
        this.initUserSplits();
      } else {
        this.errorMessage = 'No users found for this trip.';
      }
      
      if (this.categories.length === 0) {
        this.errorMessage = 'No expense categories found.';
      }
      
      this.isLoading = false;
    });
  }

  setIsSettled(value: boolean): void {
    this.isSettled = value;
    this.expenseForm.get('isSettled')!.setValue(value);
  }

  initUserSplits(): void {
    while (this.userSplits.length) {
      this.userSplits.removeAt(0);
    }
    
    this.users.forEach(user => {
      this.userSplits.push(this.fb.group({
        userId: [user.id],
        userName: [user.name],
        included: [true],
        percentage: [0],
        amount: [0]
      }));
    });
    
    this.evenSplits();
  }

  evenSplits(): void {
    const includedControls = this.userSplits.controls.filter(
      control => control.get('included')!.value
    );
    
    if (includedControls.length === 0) {
      this.userSplits.controls.forEach(control => {
        control.get('included')!.setValue(true);
      });
    }
    
    const includedCount = this.userSplits.controls.filter(
      control => control.get('included')!.value
    ).length;
    
    if (includedCount === 0) return;
    
    const evenPercentage = 100 / includedCount;
    
    this.userSplits.controls.forEach(control => {
      if (control.get('included')!.value) {
        control.get('percentage')!.setValue(evenPercentage.toFixed(2));
      } else {
        control.get('percentage')!.setValue('0');
        control.get('amount')!.setValue('0');
      }
    });
    
    this.recalculateSplits();
  }

  toggleUserInclusion(index: number): void {
    const control = this.userSplits.at(index);
    const currentValue = control.get('included')!.value;
    control.get('included')!.setValue(!currentValue);
    
    const hasIncludedUsers = this.userSplits.controls.some(
      control => control.get('included')!.value
    );
    
    if (!hasIncludedUsers) {
      control.get('included')!.setValue(true);
    }
    
    this.evenSplits();
  }

  recalculateSplits(): void {
    const totalAmount = parseFloat(this.expenseForm.get('amount')!.value) || 0;
    
    if (totalAmount <= 0) return;
    
    this.userSplits.controls.forEach(control => {
      if (control.get('included')!.value) {
        const percentage = parseFloat(control.get('percentage')!.value) || 0;
        const amount = (percentage / 100) * totalAmount;
        control.get('amount')!.setValue(amount.toFixed(2));
      } else {
        control.get('percentage')!.setValue('0');
        control.get('amount')!.setValue('0');
      }
    });
    
    this.validateTotals();
  }

  onPercentageChange(index: number): void {
    const control = this.userSplits.at(index);
    const newPercentage = parseFloat(control.get('percentage')!.value) || 0;
    
    if (newPercentage < 0) {
      control.get('percentage')!.setValue('0');
    } else if (newPercentage > 100) {
      control.get('percentage')!.setValue('100');
    }
    
    this.adjustOtherPercentages(index);
    this.recalculateSplits();
  }

  onAmountChange(index: number): void {
    const totalAmount = parseFloat(this.expenseForm.get('amount')!.value) || 0;
    if (totalAmount <= 0) return;
    
    const control = this.userSplits.at(index);
    let amount = parseFloat(control.get('amount')!.value) || 0;
    
    if (amount > totalAmount) {
      amount = totalAmount;
      control.get('amount')!.setValue(amount.toFixed(2));
    } else if (amount < 0) {
      amount = 0;
      control.get('amount')!.setValue('0');
    }
    
    const percentage = (amount / totalAmount) * 100;
    control.get('percentage')!.setValue(percentage.toFixed(2));
    
    this.adjustOtherAmounts(index);
    this.validateTotals();
  }

  adjustOtherPercentages(changedIndex: number): void {
    const changedControl = this.userSplits.at(changedIndex);
    const changedPercentage = parseFloat(changedControl.get('percentage')!.value) || 0;
    
    const otherControls = this.userSplits.controls.filter((control, i) => 
      i !== changedIndex && control.get('included')!.value
    );
    
    if (otherControls.length === 0) {
      if (changedPercentage > 100) {
        changedControl.get('percentage')!.setValue('100');
      }
      return;
    }
    
    const otherTotal = otherControls.reduce((sum, control) => 
      sum + (parseFloat(control.get('percentage')!.value) || 0), 0
    );
    
    if (changedPercentage >= 0 && changedPercentage <= 100 && changedPercentage + otherTotal > 100) {
      const remainingPercentage = 100 - changedPercentage;
      
      if (otherTotal > 0 && remainingPercentage > 0) {
        const ratio = remainingPercentage / otherTotal;
        
        otherControls.forEach(control => {
          const currentPercentage = parseFloat(control.get('percentage')!.value) || 0;
          const newPercentage = currentPercentage * ratio;
          control.get('percentage')!.setValue(newPercentage.toFixed(2));
        });
      } else {
        otherControls.forEach(control => {
          control.get('percentage')!.setValue('0');
        });
      }
    }
  }

  adjustOtherAmounts(changedIndex: number): void {
    const totalAmount = parseFloat(this.expenseForm.get('amount')!.value) || 0;
    if (totalAmount <= 0) return;
    
    const changedControl = this.userSplits.at(changedIndex);
    const changedAmount = parseFloat(changedControl.get('amount')!.value) || 0;
    
    const otherControls = this.userSplits.controls.filter((control, i) => 
      i !== changedIndex && control.get('included')!.value
    );
    
    if (otherControls.length === 0) {
      if (changedAmount > totalAmount) {
        changedControl.get('amount')!.setValue(totalAmount.toFixed(2));
        changedControl.get('percentage')!.setValue('100');
      }
      return;
    }
    
    const otherTotal = otherControls.reduce((sum, control) => 
      sum + (parseFloat(control.get('amount')!.value) || 0), 0
    );
    
    if (changedAmount >= 0 && changedAmount <= totalAmount && changedAmount + otherTotal > totalAmount) {
      const remainingAmount = totalAmount - changedAmount;
      
      if (otherTotal > 0 && remainingAmount > 0) {
        const ratio = remainingAmount / otherTotal;
        
        otherControls.forEach(control => {
          const currentAmount = parseFloat(control.get('amount')!.value) || 0;
          const newAmount = currentAmount * ratio;
          control.get('amount')!.setValue(newAmount.toFixed(2));
          
          if (totalAmount > 0) {
            const newPercentage = (newAmount / totalAmount) * 100;
            control.get('percentage')!.setValue(newPercentage.toFixed(2));
          }
        });
      } else {
        otherControls.forEach(control => {
          control.get('amount')!.setValue('0');
          control.get('percentage')!.setValue('0');
        });
      }
    }
  }

  validateTotals(): boolean {
    const totalAmount = parseFloat(this.expenseForm.get('amount')!.value) || 0;
    if (totalAmount <= 0) return false;
    
    const includedControls = this.userSplits.controls.filter(
      control => control.get('included')!.value
    );
    
    if (includedControls.length === 0) return false;
    
    let totalPercentage = 0;
    let totalSplitAmount = 0;
    
    includedControls.forEach(control => {
      totalPercentage += parseFloat(control.get('percentage')!.value) || 0;
      totalSplitAmount += parseFloat(control.get('amount')!.value) || 0;
    });
    
    if (includedControls.length > 0 && (Math.abs(totalPercentage - 100) > 0.01 || Math.abs(totalSplitAmount - totalAmount) > 0.01)) {
      const lastControl = includedControls[includedControls.length - 1];
      
      const otherPercentages = includedControls
        .slice(0, -1)
        .reduce((sum, control) => sum + (parseFloat(control.get('percentage')!.value) || 0), 0);
      
      const otherAmounts = includedControls
        .slice(0, -1)
        .reduce((sum, control) => sum + (parseFloat(control.get('amount')!.value) || 0), 0);
      
      const correctLastPercentage = Math.max(0, Math.min(100, 100 - otherPercentages));
      const correctLastAmount = Math.max(0, Math.min(totalAmount, totalAmount - otherAmounts));
      
      lastControl.get('percentage')!.setValue(correctLastPercentage.toFixed(2));
      lastControl.get('amount')!.setValue(correctLastAmount.toFixed(2));
      
      totalPercentage = otherPercentages + correctLastPercentage;
      totalSplitAmount = otherAmounts + correctLastAmount;
    }
    
    return Math.abs(totalPercentage - 100) <= 0.01 && Math.abs(totalSplitAmount - totalAmount) <= 0.01;
  }

  validateForm(): boolean {
    if (this.expenseForm.invalid) return false;
    
    const hasIncludedUsers = this.userSplits.controls.some(
      control => control.get('included')!.value
    );
    
    if (!hasIncludedUsers) return false;
    
    return this.validateTotals();
  }

  hasIncludedUsers(): boolean {
    return this.userSplits.controls.some(
      control => control.get('included')!.value
    );
  }

goBack(): void {
  if (!this.tripId) {
    console.error('Trip ID not available to navigate back.');
    return;
  }
  this.router.navigate(['/trip-itinerary', this.tripId]);
}
}