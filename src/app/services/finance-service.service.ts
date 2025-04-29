import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the Finance interface
export interface Finance {
  id: string;
  name: string;
  tripId: string;
  categoryId?: number;
  payedbyuserId: number;
  ammount: string;
  currencyCode: string;
  description: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceServiceService {
  private apiUrl = 'http://localhost:5253/api/expenses';

  constructor(private http: HttpClient) { }

  getAllExpenses(): Observable<Finance[]> {
    return this.http.get<Finance[]>(this.apiUrl);
  }

  getExpenseById(id: string): Observable<Finance> {
    return this.http.get<Finance>(`${this.apiUrl}/${id}`);
  }

  createExpense(expense: Finance): Observable<Finance> {
    return this.http.post<Finance>(this.apiUrl, expense, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  updateExpense(id: string, expense: Finance): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, expense, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  // Delete an expense
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
