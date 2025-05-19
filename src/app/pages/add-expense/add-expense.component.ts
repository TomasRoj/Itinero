import { Component, OnInit } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpenseService, ExpenseCategory, ExpenseSplit, Expense, User, Currency } from '../../services/finance-service.service';
import { TripMemberService, TripMember, TripMemberWithUser } from '../../services/trip-member.service';
import { Trip, TripService } from '../../services/trip-service.service';
import { forkJoin, catchError, of, switchMap, tap } from 'rxjs';

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
  currencies: Currency[] = [];
  isSettled: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  tripId: number = 0;
  currentTrip?: Trip;
  
  // UI States
  isFormValid: boolean = false;
  isTotalValid: boolean = true;
  isSubmitting: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private tripService: TripService,
    private tripMemberService: TripMemberService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currencies = this.expenseService.getAllCurrencies();
  }

  ngOnInit(): void {
    this.initForm();
    
    this.route.params.subscribe(params => {
      if (params['tripId']) {
        this.tripId = +params['tripId'];
        this.loadData();
      } else {
        this.errorMessage = 'No trip ID provided';
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

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // First get trip details to ensure the trip exists
    this.tripService.getTripById(this.tripId).pipe(
      tap(trip => {
        this.currentTrip = trip;
      }),
      // Then get the categories and trip members with user details
      switchMap(() => {
        return forkJoin({
          categories: this.expenseService.getAllCategories(),
          // Use the trip members service to get users participating in the trip
          tripMembers: this.tripMemberService.getMembersWithUsersByTripId(this.tripId)
        });
      }),
      catchError(error => {
        console.error('Error loading data', error);
        this.errorMessage = 'Failed to load data. Please try again later.';
        this.isLoading = false;
        return of({ categories: [], tripMembers: [] });
      })
    ).subscribe(result => {
      this.categories = result.categories;
      
      // Extract user information from trip members
      this.users = result.tripMembers.map(member => member.user);
      
      if (this.users.length === 0) {
        this.errorMessage = 'No users found for this trip.';
      } else if (this.categories.length === 0) {
        this.errorMessage = 'No expense categories found.';
      } else {
        this.initUserSplits();
      }
      
      this.isLoading = false;
    });
  }

  get userSplits(): FormArray {
    return this.expenseForm.get('userSplits') as FormArray;
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
      // If no users are included, include all and then split
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

  setIsSettled(value: boolean): void {
    this.isSettled = value;
    this.expenseForm.get('isSettled')!.setValue(value);
  }

  toggleUserInclusion(index: number): void {
    const control = this.userSplits.at(index);
    const currentValue = control.get('included')!.value;
    control.get('included')!.setValue(!currentValue);
    
    // After toggling, distribute evenly among remaining included users
    const hasIncludedUsers = this.userSplits.controls.some(
      control => control.get('included')!.value
    );
    
    if (!hasIncludedUsers) {
      // If no users are included after toggle, include the current one
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
    
    // Ensure amount doesn't exceed total
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
    
    // Get all included controls except the changed one
    const otherControls = this.userSplits.controls.filter((control, i) => 
      i !== changedIndex && control.get('included')!.value
    );
    
    if (otherControls.length === 0) {
      if (changedPercentage > 100) {
        changedControl.get('percentage')!.setValue('100');
      }
      return;
    }
    
    // Calculate total of other percentages
    const otherTotal = otherControls.reduce((sum, control) => 
      sum + (parseFloat(control.get('percentage')!.value) || 0), 0
    );
    
    // If changed percentage is valid and total exceeds 100%
    if (changedPercentage >= 0 && changedPercentage <= 100 && changedPercentage + otherTotal > 100) {
      const remainingPercentage = 100 - changedPercentage;
      
      // If others need adjustment and there's anything remaining
      if (otherTotal > 0 && remainingPercentage > 0) {
        const ratio = remainingPercentage / otherTotal;
        
        // Adjust other percentages proportionally
        otherControls.forEach(control => {
          const currentPercentage = parseFloat(control.get('percentage')!.value) || 0;
          const newPercentage = currentPercentage * ratio;
          control.get('percentage')!.setValue(newPercentage.toFixed(2));
        });
      } else {
        // If nothing left, set others to 0
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
    
    // Get all included controls except the changed one
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
    
    // Calculate total of other amounts
    const otherTotal = otherControls.reduce((sum, control) => 
      sum + (parseFloat(control.get('amount')!.value) || 0), 0
    );
    
    // If changed amount is valid and total exceeds the expense amount
    if (changedAmount >= 0 && changedAmount <= totalAmount && changedAmount + otherTotal > totalAmount) {
      const remainingAmount = totalAmount - changedAmount;
      
      // If others need adjustment and there's anything remaining
      if (otherTotal > 0 && remainingAmount > 0) {
        const ratio = remainingAmount / otherTotal;
        
        // Adjust other amounts proportionally
        otherControls.forEach(control => {
          const currentAmount = parseFloat(control.get('amount')!.value) || 0;
          const newAmount = currentAmount * ratio;
          control.get('amount')!.setValue(newAmount.toFixed(2));
          
          // Update percentage to match
          if (totalAmount > 0) {
            const newPercentage = (newAmount / totalAmount) * 100;
            control.get('percentage')!.setValue(newPercentage.toFixed(2));
          }
        });
      } else {
        // If nothing left, set others to 0
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
    
    // Get included controls
    const includedControls = this.userSplits.controls.filter(
      control => control.get('included')!.value
    );
    
    if (includedControls.length === 0) return false;
    
    // Calculate total percentage and amount
    let totalPercentage = 0;
    let totalSplitAmount = 0;
    
    includedControls.forEach(control => {
      totalPercentage += parseFloat(control.get('percentage')!.value) || 0;
      totalSplitAmount += parseFloat(control.get('amount')!.value) || 0;
    });
    
    // Fix rounding issues in the last control if needed
    if (includedControls.length > 0 && (Math.abs(totalPercentage - 100) > 0.01 || Math.abs(totalSplitAmount - totalAmount) > 0.01)) {
      const lastControl = includedControls[includedControls.length - 1];
      
      // Sum all but last
      const otherPercentages = includedControls
        .slice(0, -1)
        .reduce((sum, control) => sum + (parseFloat(control.get('percentage')!.value) || 0), 0);
      
      const otherAmounts = includedControls
        .slice(0, -1)
        .reduce((sum, control) => sum + (parseFloat(control.get('amount')!.value) || 0), 0);
      
      // Fix last control
      const correctLastPercentage = Math.max(0, Math.min(100, 100 - otherPercentages));
      const correctLastAmount = Math.max(0, Math.min(totalAmount, totalAmount - otherAmounts));
      
      lastControl.get('percentage')!.setValue(correctLastPercentage.toFixed(2));
      lastControl.get('amount')!.setValue(correctLastAmount.toFixed(2));
      
      // Recalculate totals
      totalPercentage = otherPercentages + correctLastPercentage;
      totalSplitAmount = otherAmounts + correctLastAmount;
    }
    
    // Return true if totals are valid
    return Math.abs(totalPercentage - 100) <= 0.01 && Math.abs(totalSplitAmount - totalAmount) <= 0.01;
  }

  validateForm(): boolean {
    // Check required fields
    if (this.expenseForm.invalid) return false;
    
    // Ensure we have at least one included user
    const hasIncludedUsers = this.userSplits.controls.some(
      control => control.get('included')!.value
    );
    
    if (!hasIncludedUsers) return false;
    
    // Check if splits are valid
    return this.validateTotals();
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
      tripId: this.tripId,
      category_Id: parseInt(formValue.categoryId),
      paidByUserId: parseInt(formValue.paidByUserId),
      amount: parseFloat(formValue.amount),
      currency_Code: formValue.currency,
      description: formValue.description || '',
      date: new Date()
    };
    
    // Create splits
    const splits: ExpenseSplit[] = formValue.userSplits
      .filter((split: any) => split.included)
      .map((split: any) => ({
        expense_id: 0, // Will be set after expense is created
        user_Id: parseInt(split.userId),
        amount: parseFloat(split.amount),
        is_settled: formValue.isSettled,
        settled_At: formValue.isSettled ? new Date() : null,
        trip_Id: this.tripId
      }));

    // Save using service
    this.expenseService.createExpenseWithSplits(expense, splits)
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.successMessage = 'Expense added successfully!';
          
          // Navigate after a brief delay to show success message
          setTimeout(() => {
            this.router.navigate(['/trip', this.tripId, 'expenses']);
          }, 1500);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = 'Error creating expense: ' + (error.message || 'Unknown error');
          console.error('Error saving expense', error);
        }
      });
  }

  hasIncludedUsers(): boolean {
    return this.userSplits.controls.some(
      control => control.get('included')!.value
    );
  }

  getTotalPercentage(): number {
    return this.userSplits.controls
      .filter(control => control.get('included')!.value)
      .reduce((sum, control) => sum + (parseFloat(control.get('percentage')!.value) || 0), 0);
  }

  getTotalSplitAmount(): number {
    return this.userSplits.controls
      .filter(control => control.get('included')!.value)
      .reduce((sum, control) => sum + (parseFloat(control.get('amount')!.value) || 0), 0);
  }

  resetForm(): void {
    this.expenseForm.reset({
      currency: 'CZK',
      isSettled: false
    });
    this.initUserSplits();
    this.errorMessage = '';
    this.successMessage = '';
  }

  goBack(): void {
    if (this.tripId) {
      this.router.navigate(['/trip', this.tripId, 'expenses']);
    } else {
      this.router.navigate(['/expenses']);
    }
  }
}