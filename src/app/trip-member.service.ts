import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip} from './services/trip-service.service';  

export interface TripMember {
  id?: number;
  tripId: number;
  userId: number;
  role?: string;
  joinedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})

export class TripMemberService {
  private apiUrl = 'http://localhost:5253/api/TripMembers';

  constructor(private http: HttpClient) {}

  addTripMember(tripId: number, userId: number): Observable<any> {
    const now = new Date().toISOString();
  
    const payload = {
      trip_id: tripId,
      user_id: userId,
      role: 'member', // výchozí hodnota
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

  getTripsForMember(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/for-member/${userId}`);
  }  

}
