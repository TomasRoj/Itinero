import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from './trip-service.service';
import { User } from './finance-service.service';

export interface TripMember {
  id: number;
  trip_id: number;
  user_id: number;
  role?: string;
  joined_at?: Date;
}

export interface TripMemberWithUser extends TripMember {
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class TripMemberService {
  private apiUrl = 'http://localhost:5253/api/TripMembers';

  constructor(private http: HttpClient) {}

  addTripMember(tripId: number, userId: number, role: string = 'Member'): Observable<any> {
    const now = new Date().toISOString();
  
    const payload = {
      trip_id: tripId,
      user_id: userId,
      role: role,
      joined_at: now
    };
  
    return this.http.post(this.apiUrl, payload);
  }
  
  getTripMembers(): Observable<TripMember[]> {
    return this.http.get<TripMember[]>(this.apiUrl);
  }

  deleteTripMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateMemberRole(memberId: number, updatedFields: Partial<TripMember>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${memberId}`, updatedFields);
  }

  getTripsForMember(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/for-member/${userId}`);
  }  
  
  getMembersByTripId(tripId: number): Observable<TripMember[]> {
    return this.http.get<TripMember[]>(`${this.apiUrl}/for-trip/${tripId}`);
  }

  getMembersWithUsersByTripId(tripId: number): Observable<TripMemberWithUser[]> {
    return this.http.get<TripMemberWithUser[]>(`${this.apiUrl}/for-trip/${tripId}/with-users`);
  }
}