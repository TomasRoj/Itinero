import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trip {

  // toto staci udelat podle prislusneho modelu v API
  /*
  public int Id { get; set; }
  public string Name { get; set; }
  public int creator_id { get; set; }
  public int Destination_city_id { get; set; }
  public DateTime Start_date { get; set; }
  public DateTime End_date { get; set; }
  public string? Description { get; set; }
  public bool Is_public { get; set; } = false;
  public DateTime created_at { get; set; } = DateTime.UtcNow;
  public DateTime updated_at { get; set; } = DateTime.UtcNow;

  na toto:
  */

  id: number;
  name: string;
  creator_id: number;
  destination_city_id: number;
  start_date: Date;       
  end_date: Date;         
  description?: string;
  is_public: boolean;
  created_at: Date;      
  updated_at: Date;      
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'https://localhost:5001/api/trips'; // <- URL na tvoje API podivej se na url

  constructor(private http: HttpClient) { }

  // Samotne metody pro CRUD operace
  // Vsechny metody vraci Observable, coz je typ pro asynchronni operace v Angularu
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
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
