import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Expense {
  id?: number;
  name: string;
  tripId: number;
  categoryId?: number;
  paidByUserId: number;
  amount: number;
  currencyCode: string;
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
  expenseId: number;
  userId: number;
  amount: number;
  isSettled: boolean;
  settledAt?: Date;
  tripId: number;
}

export interface User {
  id: number;
  name: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expensesUrl = 'http://localhost:5253/api/expenses';
  private splitsUrl = 'http://localhost:5253/api/expensesplits';
  private categoriesUrl = 'http://localhost:5253/api/expensecategories';
  
  constructor(private http: HttpClient) { }

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
    return this.http.post<Expense>(this.expensesUrl, expense, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  updateExpense(id: number, expense: Expense): Observable<void> {
    return this.http.put<void>(`${this.expensesUrl}/${id}`, expense, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.expensesUrl}/${id}`);
  }

  // Expense splits methods
  getSplitsByExpenseId(expenseId: number): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(`${this.splitsUrl}/expense/${expenseId}`);
  }

  getSplitsByTripId(tripId: number): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(`${this.splitsUrl}/trip/${tripId}`);
  }

  createExpenseSplit(split: ExpenseSplit): Observable<ExpenseSplit> {
    return this.http.post<ExpenseSplit>(this.splitsUrl, split);
  }

  updateExpenseSplit(id: number, split: ExpenseSplit): Observable<void> {
    return this.http.put<void>(`${this.splitsUrl}/${id}`, split);
  }

  deleteExpenseSplit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.splitsUrl}/${id}`);
  }

  // Expense categories methods
  getAllCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(this.categoriesUrl);
  }
}