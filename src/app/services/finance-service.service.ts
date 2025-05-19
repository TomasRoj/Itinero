import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin, throwError, switchMap } from 'rxjs';
import { Trip } from './trip-service.service';
import { TripMember } from './trip-member.service';

export interface Expense {
  id: number;
  name: string;
  tripId: number;
  category_Id?: number;
  paidByUserId: number;
  amount: number;
  currency_Code: string;
  description: string;
  date: Date;
  receiptImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface ExpenseSplit {
  id?: number;
  expense_id: number;
  user_Id: number;
  amount: number;
  is_settled: boolean;
  settled_At?: Date;
  trip_Id: number;
}

export interface User {
  id: number;
  name: string;
  avatar?: string;
}

export interface ExpenseWithSplits {
  expense: Expense;
  splits: ExpenseSplit[];
  paidBy?: User;
  category?: ExpenseCategory;
}

export interface Currency {
  code: string;
  name: string;
  symbol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiBaseUrl = 'http://localhost:5253/api';
  private expensesUrl = `${this.apiBaseUrl}/expenses`;
  private splitsUrl = `${this.apiBaseUrl}/expensesplits`;
  private categoriesUrl = `${this.apiBaseUrl}/expensecategories`;
  private usersUrl = `${this.apiBaseUrl}/users`;
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  currencies: Currency[] = [
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'US Dollar', symbol: '$' }
  ];
  
  constructor(private http: HttpClient) { }

  getAllCurrencies(): Currency[] {
    return this.currencies;
  }

  // User methods
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }

  getUsersByTripId(tripId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersUrl}/trip/${tripId}`);
  }

  // Expense methods
  getAllExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.expensesUrl);
  }

  getExpensesByTripId(tripId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.expensesUrl}/trip/${tripId}`);
  }

  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.expensesUrl}/${id}`);
  }

  createExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(this.expensesUrl, expense, this.httpOptions);
  }

  updateExpense(id: number, expense: Expense): Observable<void> {
    return this.http.put<void>(`${this.expensesUrl}/${id}`, expense, this.httpOptions);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.expensesUrl}/${id}`);
  }

  // ExpenseCategory methods
  getAllCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(this.categoriesUrl);
  }

  getCategoryById(id: number): Observable<ExpenseCategory> {
    return this.http.get<ExpenseCategory>(`${this.categoriesUrl}/${id}`);
  }

  createCategory(category: ExpenseCategory): Observable<ExpenseCategory> {
    return this.http.post<ExpenseCategory>(this.categoriesUrl, category, this.httpOptions);
  }

  updateCategory(id: number, category: ExpenseCategory): Observable<void> {
    return this.http.put<void>(`${this.categoriesUrl}/${id}`, category, this.httpOptions);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  // ExpenseSplit methods
  getAllSplits(): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(this.splitsUrl);
  }

  getSplitsByExpenseId(expenseId: number): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(`${this.splitsUrl}/expense/${expenseId}`);
  }

  getSplitsByUserId(userId: number): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(`${this.splitsUrl}/user/${userId}`);
  }

  getSplitsByTripId(tripId: number): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(`${this.splitsUrl}/trip/${tripId}`);
  }

  createSplit(split: ExpenseSplit): Observable<ExpenseSplit> {
    return this.http.post<ExpenseSplit>(this.splitsUrl, split, this.httpOptions);
  }

  updateSplit(id: number, split: ExpenseSplit): Observable<void> {
    return this.http.put<void>(`${this.splitsUrl}/${id}`, split, this.httpOptions);
  }

  deleteSplit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.splitsUrl}/${id}`);
  }

  settleExpenseSplits(expenseId: number): Observable<void> {
    return this.http.put<void>(`${this.splitsUrl}/settleexpense/${expenseId}`, {}, this.httpOptions);
  }

  // Utility methods for the Add Expense page
  createExpenseWithSplits(expense: Expense, splits: ExpenseSplit[]): Observable<Expense> {
    return this.createExpense(expense).pipe(
      switchMap(createdExpense => {
        const updatedSplits = splits.map(split => ({
          ...split,
          expense_id: createdExpense.id
        }));
        
        if (updatedSplits.length === 0) {
          return of(createdExpense);
        }
        
        const splitObservables = updatedSplits.map(split => this.createSplit(split));
        return forkJoin(splitObservables).pipe(
          map(() => createdExpense),
          catchError(error => {
            console.error('Error creating splits', error);
            this.deleteExpense(createdExpense.id).subscribe();
            return throwError(() => new Error('Failed to create expense splits'));
          })
        );
      }),
      catchError(error => {
        console.error('Error creating expense', error);
        return throwError(() => error);
      })
    );
  }
  calculateBalances(tripId: number): Observable<{ [userId: number]: number }> {
    return this.getSplitsByTripId(tripId).pipe(
      switchMap(splits => {
        return this.getExpensesByTripId(tripId).pipe(
          map(expenses => {
            const balances: { [userId: number]: number } = {};
            
            expenses.forEach(expense => {
              const paidBy = expense.paidByUserId;
              if (!balances[paidBy]) balances[paidBy] = 0;
              balances[paidBy] += expense.amount;
            });
            
            splits.forEach(split => {
              const owedBy = split.user_Id;
              if (!balances[owedBy]) balances[owedBy] = 0;
              balances[owedBy] -= split.amount;
            });
            
            return balances;
          })
        );
      })
    );
  }
}