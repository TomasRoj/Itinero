// user-service.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash?: string;
  profile_picture?: string;
  preferedcurrency: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5253/api/Users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) { 
    // Load the current user when the service is initialized
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.getCurrentUser().subscribe();
    }
  }

  // Get user ID from JWT token
  private getUserIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return parseInt(decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get currently logged-in user
  getCurrentUser(): Observable<User> {
    const userId = this.getUserIdFromToken();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  // Update user profile
  updateUser(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/${user.id}`, user).pipe(
      tap(() => this.currentUserSubject.next(user))
    );
  }

  // Helper method to update profile picture
  updateProfilePicture(userId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.post(`${this.apiUrl}/${userId}/profile-picture`, formData);
  }
}