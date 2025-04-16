import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Destination {
  id: number;
  name: string;
  description: string | null;
  best_time_to_visit: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable({
  providedIn: 'root'
})

export class DestinationServiceService {

  constructor(private http: HttpClient) { }

  private apiUrl = 'http://localhost:5253/api/Cities';
  
  getDestinations(): Observable<Destination[]> {
      return this.http.get<Destination[]>(this.apiUrl);
    }
  
    getDestinationById(id: number): Observable<Destination> {
      return this.http.get<Destination>(`${this.apiUrl}/${id}`);
    }
  
    createDestination(Destination: Destination): Observable<Destination> {
      return this.http.post<Destination>(this.apiUrl, Destination);
    }
  
    updateDestination(id: number, Destination: Destination): Observable<any> {
      return this.http.put(`${this.apiUrl}/${id}`, Destination);
    }
  
    deleteDestination(id: number): Observable<any> {
      return this.http.delete(`${this.apiUrl}/${id}`);
    }

}
