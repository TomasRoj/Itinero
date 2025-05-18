import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trip {
  id?: number;
  name: string;
  creator_id: number;
  destination_city_id: number;
  start_date: Date;
  end_date: Date;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  photoURL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'http://localhost:5253/api/trips';

  constructor(private http: HttpClient) { }

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  getTripsByUserId(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/user/${userId}`);
  }

  getTripById(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  createTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, trip);
  }

  updateTrip(id: number, trip: Trip): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, trip);
  }

  deleteTrip(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}