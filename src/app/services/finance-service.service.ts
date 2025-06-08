import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin, throwError, switchMap, tap } from 'rxjs';
import { Trip } from './trip-service.service';
import { TripMember } from './trip-member.service';
import { User, UserService } from './user-service.service';


export interface Expense {
  id: number;
  name: string;
  trip_Id: number;
  category_Id?: number;
  paid_by_user_id: number;
  amount: number;
  currency_Code: string;
  description: string;
  date: Date;
  receipt_image?: string;
  created_At?: Date;
  updated_At?: Date;
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

export interface CreateMultipleExpenseSplitsRequest {
  userIds: number[];
  totalAmount: number;
  splitType: string;
  userAmounts?: { [key: string]: number };
  isSettled?: boolean; 
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
  //#region splits
  getAllSplits(): Observable<ExpenseSplit[]> {
    return this.http.get<ExpenseSplit[]>(this.splitsUrl);
  }

unsettleExpenseSplits(expenseId: number): Observable<void> {
  return this.http.put<void>(`${this.splitsUrl}/UnsettleExpense/${expenseId}`, {}, this.httpOptions)
    .pipe(
      catchError(error => {
        console.error('Error unsettling expense splits:', error);
        return throwError(() => error);
      })
    );
}
getExpensesByTripIdWithSettlementStatus(tripId: number): Observable<{expense: Expense, isSettled: boolean}[]> {
  return this.http.get<{expense: Expense, isSettled: boolean}[]>(`${this.expensesUrl}/trip/${tripId}/with-settlement-status`);
}

  getSplitById(id: number): Observable<ExpenseSplit> {
    return this.http.get<ExpenseSplit>(`${this.splitsUrl}/${id}`);
  }
getExpenseWithSettlementStatus(expenseId: number): Observable<{expense: Expense, isSettled: boolean}> {
  return this.http.get<{expense: Expense, isSettled: boolean}>(`${this.expensesUrl}/${expenseId}/settlement-status`);
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

  createMultipleExpenseSplits(expenseId: number, request: CreateMultipleExpenseSplitsRequest): Observable<ExpenseSplit[]> {
    return this.http.post<ExpenseSplit[]>(`${this.splitsUrl}/CreateMultipleForExpense/${expenseId}`, request, this.httpOptions)
      .pipe(
        tap(response => console.log('Multiple expense splits created:', response)),
        catchError(error => {
          console.error('Error creating multiple expense splits:', error);
          return throwError(() => error);
        })
      );
  }

  updateSplit(id: number, split: ExpenseSplit): Observable<void> {
    return this.http.put<void>(`${this.splitsUrl}/${id}`, split, this.httpOptions);
  }

  deleteSplit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.splitsUrl}/${id}`);
  }

  settleExpenseSplits(expenseId: number): Observable<void> {
    return this.http.put<void>(`${this.splitsUrl}/SettleExpense/${expenseId}`, {}, this.httpOptions)
      .pipe(
        tap(response => console.log('Expense splits settled successfully:', response)),
        catchError(error => {
          console.error('Error settling expense splits:', error);
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
              const paidBy = expense.paid_by_user_id;
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
  //#endregion splits

  //#region expenses
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
    // Map Angular model properties to match the backend expected property names
    const backendExpense = {
      id: expense.id,
      name: expense.name,
      // Map tripId to Trip_Id as expected by the backend
      Trip_Id: expense.trip_Id,
      Category_Id: expense.category_Id,
      // Map paidByUserId to paid_by_user_id as expected by the backend
      paid_by_user_id: expense.paid_by_user_id,
      Amount: expense.amount,
      Currency_Code: expense.currency_Code,
      Description: expense.description,
      Date: expense.date,
      Receipt_image: expense.receipt_image,
      Created_At: expense.created_At,
      Updated_At: expense.updated_At
    };

    return this.http.post<Expense>(this.expensesUrl, backendExpense, this.httpOptions)
      .pipe(
        // For debugging
        tap(response => console.log('Expense created:', response)),
        catchError(error => {
          console.error('Error creating expense:', error);
          return throwError(() => error);
        })
      );
  }

  updateExpense(id: number, expense: Expense): Observable<void> {
    return this.http.put<void>(`${this.expensesUrl}/${id}`, expense, this.httpOptions);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.expensesUrl}/${id}`);
  }
  //#endregion

  //#region categories
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
  //#endregion

}