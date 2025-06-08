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

export interface Category {
  id: number;
  name: string;
}

export interface UserSplit {
  userId: number;
  userName: string;
  amount: number;
  selected: boolean;
}

export interface ExpenseData {
  id: number;
  name: string;
  categoryId: number;
  paidByUserId: number;
  amount: number;
  currency: string;
  description: string;
  expenseType: 'personal' | 'shared';
  splits: Array<{
    userId: number;
    amount: number;
    selected: boolean;
  }>;
  splitType: 'equal' | 'custom';
  isSettled: boolean;
}

@Component({
  selector: 'app-edit-expense',
  templateUrl: './edit-expense.component.html',
  styleUrls: ['./edit-expense.component.scss'],
  imports: [    ItinerarySidebarComponent,
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,]
})
export class EditExpenseComponent implements OnInit {
  expenseForm: FormGroup;
  categories: Category[] = [];
  users: User[] = [];
  userSplits: UserSplit[] = [];
  
  currentExpenseType: 'personal' | 'shared' = 'personal';
  currentSplitType: 'equal' | 'custom' = 'equal';
  isSettled = false;
  isLoading = false;
  
  errorMessage = '';
  successMessage = '';
  splitErrorMessage = '';

  // Mock data - replace with actual service calls
  private mockCategories: Category[] = [
    { id: 1, name: 'Jídlo a pití' },
    { id: 2, name: 'Doprava' },
    { id: 3, name: 'Ubytování' },
    { id: 4, name: 'Zábava' },
    { id: 5, name: 'Ostatní' }
  ];

  private mockExpenseData: ExpenseData = {
    id: 123,
    name: 'Večeře v restauraci',
    categoryId: 1,
    paidByUserId: 1,
    amount: 1200.50,
    currency: 'CZK',
    description: 'Společná večeře první den',
    expenseType: 'shared',
    splits: [
      { userId: 1, amount: 300.13, selected: true },
      { userId: 2, amount: 300.12, selected: true },
      { userId: 3, amount: 300.12, selected: true },
      { userId: 4, amount: 300.13, selected: true }
    ],
    splitType: 'equal',
    isSettled: false
  };

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private tripService: TripService,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.expenseForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      paidByUserId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['CZK'],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFormSubscriptions();
  }

  private loadData(): void {
    // In a real app, these would be service calls

    
    // Initialize user splits
    this.userSplits = this.users.map(user => ({
      userId: user.id,
      userName: user.name,
      amount: 0,
      selected: false
    }));

    this.loadExpenseData();
  }

  private loadExpenseData(): void {
    const data = this.mockExpenseData;
    
    // Populate form
    this.expenseForm.patchValue({
      name: data.name,
      categoryId: data.categoryId,
      paidByUserId: data.paidByUserId,
      amount: data.amount,
      currency: data.currency,
      description: data.description
    });

    // Set expense type
    this.currentExpenseType = data.expenseType;
    this.currentSplitType = data.splitType;
    this.isSettled = data.isSettled;

    // Load splits if shared expense
    if (data.expenseType === 'shared') {
      data.splits.forEach(split => {
        const userSplit = this.userSplits.find(us => us.userId === split.userId);
        if (userSplit) {
          userSplit.selected = split.selected;
          userSplit.amount = split.amount;
        }
      });
    }

    this.updateTotals();
  }

  private setupFormSubscriptions(): void {
    // Watch amount changes
    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      if (this.currentExpenseType === 'shared') {
        this.recalculateSplits();
      }
      this.updateTotals();
    });

    // Watch paid by changes
    this.expenseForm.get('paidByUserId')?.valueChanges.subscribe((userId) => {
      if (this.currentExpenseType === 'shared' && userId) {
        this.selectPayerInSplits(parseInt(userId));
      }
    });
  }

  onExpenseTypeChange(type: 'personal' | 'shared'): void {
    this.currentExpenseType = type;
    if (type === 'shared') {
      this.recalculateSplits();
    }
    this.updateTotals();
  }

  onSplitTypeChange(type: 'equal' | 'custom'): void {
    this.currentSplitType = type;
    this.recalculateSplits();
  }

  toggleUserSelection(index: number): void {
    this.userSplits[index].selected = !this.userSplits[index].selected;
    if (!this.userSplits[index].selected) {
      this.userSplits[index].amount = 0;
    }
    this.recalculateSplits();
    this.updateTotals();
  }

  updateCustomAmount(index: number, value: string): void {
    if (this.userSplits[index].selected) {
      this.userSplits[index].amount = parseFloat(value) || 0;
      this.updateTotals();
    }
  }

  selectAllUsers(): void {
    this.userSplits.forEach(split => split.selected = true);
    this.recalculateSplits();
    this.updateTotals();
  }

  deselectAllUsers(): void {
    this.userSplits.forEach(split => {
      split.selected = false;
      split.amount = 0;
    });
    this.updateTotals();
  }

  private selectPayerInSplits(payerUserId: number): void {
    if (this.currentExpenseType === 'shared') {
      const payerIndex = this.userSplits.findIndex(split => split.userId === payerUserId);
      if (payerIndex !== -1) {
        this.userSplits[payerIndex].selected = true;
        this.recalculateSplits();
        this.updateTotals();
      }
    }
  }

  private recalculateSplits(): void {
    if (this.currentExpenseType !== 'shared') return;

    const selectedUsers = this.userSplits.filter(split => split.selected);
    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;

    if (selectedUsers.length === 0 || totalAmount <= 0) {
      this.userSplits.forEach(split => split.amount = 0);
      return;
    }

    if (this.currentSplitType === 'equal') {
      this.calculateEqualSplits(selectedUsers, totalAmount);
    } else {
      // For custom splits, reset unselected users to 0
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

    // Reset all amounts
    this.userSplits.forEach(split => split.amount = 0);

    // Calculate equal splits
    selectedUsers.forEach((split, splitIndex) => {
      let amount = baseAmount;
      if (splitIndex === 0 && remainder > 0) {
        amount = Math.round((amount + remainder) * 100) / 100;
      }
      split.amount = amount;
    });
  }

  private updateTotals(): void {
    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;
    const splitAmount = this.userSplits
      .filter(split => split.selected)
      .reduce((sum, split) => sum + split.amount, 0);

    this.updateSplitError(totalAmount, splitAmount);
  }

  private updateSplitError(totalAmount: number, splitAmount: number): void {
    if (this.currentExpenseType !== 'shared') {
      this.splitErrorMessage = '';
      return;
    }

    const selectedUsers = this.userSplits.filter(split => split.selected);
    
    if (selectedUsers.length === 0) {
      this.splitErrorMessage = 'Vyberte alespoň jednu osobu pro rozdělení výdaje.';
      return;
    }

    if (totalAmount <= 0) {
      this.splitErrorMessage = 'Zadejte platnou částku výdaje.';
      return;
    }

    if (this.currentSplitType === 'custom') {
      for (const split of selectedUsers) {
        if (!split.amount || split.amount <= 0) {
          this.splitErrorMessage = `Zadejte platnou částku pro uživatele ${split.userName}.`;
          return;
        }
      }
    }

    const difference = Math.abs(splitAmount - totalAmount);
    if (difference > 0.01) {
      this.splitErrorMessage = `Součet rozdělených částek (${splitAmount.toFixed(2)}) se neshoduje s celkovou částkou (${totalAmount.toFixed(2)}).`;
      return;
    }

    this.splitErrorMessage = '';
  }

  setSettlement(settled: boolean): void {
    this.isSettled = settled;
  }

  getTotalAmount(): number {
    return parseFloat(this.expenseForm.get('amount')?.value) || 0;
  }

  getSplitAmount(): number {
    return this.userSplits
      .filter(split => split.selected)
      .reduce((sum, split) => sum + split.amount, 0);
  }

  getCurrency(): string {
    return this.expenseForm.get('currency')?.value || 'CZK';
  }

  isSplitMatching(): boolean {
    const totalAmount = this.getTotalAmount();
    const splitAmount = this.getSplitAmount();
    return Math.abs(totalAmount - splitAmount) <= 0.01;
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    if (this.currentExpenseType === 'shared') {
      const selectedUsers = this.userSplits.filter(split => split.selected);
      const splitAmount = selectedUsers.reduce((sum, split) => sum + split.amount, 0);
      const totalAmount = this.getTotalAmount();
      
      if (selectedUsers.length === 0) {
        this.errorMessage = 'Vyberte alespoň jednu osobu pro rozdělení výdaje.';
        return;
      }
      
      if (Math.abs(splitAmount - totalAmount) > 0.01) {
        this.errorMessage = 'Součet rozdělených částek se neshoduje s celkovou částkou.';
        return;
      }
    }

    this.hideMessages();
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      const updateData = {
        id: this.mockExpenseData.id,
        ...this.expenseForm.value,
        expenseType: this.currentExpenseType,
        splitType: this.currentSplitType,
        userSplits: this.userSplits.filter(split => split.selected),
        isSettled: this.isSettled
      };

      console.log('Updating expense with data:', updateData);
      
      this.isLoading = false;
      this.successMessage = 'Výdaj byl úspěšně aktualizován!';
      
      // Redirect after success
      setTimeout(() => {
        // this.router.navigate(['/trip-itinerary', this.mockExpenseData.id]);
        console.log('Would redirect to trip itinerary');
      }, 1500);
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/trip-itinerary', 21]);
  }

  private hideMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Template helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'name': return 'Název je povinný';
          case 'categoryId': return 'Kategorie je povinná';
          case 'paidByUserId': return 'Prosím vyberte kdo platbu uhradil';
          case 'amount': return 'Prosím zadejte validní částku';
          default: return 'Toto pole je povinné';
        }
      }
      if (field.errors['min']) {
        return 'Prosím zadejte validní částku';
      }
    }
    return '';
  }
}