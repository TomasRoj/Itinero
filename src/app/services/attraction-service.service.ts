import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Attraction {
  id: number | null;
  country: string;
  city_id?: number;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_visit_time: number | null;
  entrance_fee: number | null;
  currency_code: string | null;
  opening_hours: string | null;
  website: string | null;
  photo_url: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AttractionService {
  private apiUrl = 'http://localhost:5253/api/Attractions';

  constructor(private http: HttpClient) { }

  getAttractions(): Observable<Attraction[]> {
    return this.http.get<Attraction[]>(this.apiUrl);
  }

  getAttractionById(id: number): Observable<Attraction> {
    return this.http.get<Attraction>(`${this.apiUrl}/${id}`);
  }

  createAttraction(Attraction: Attraction): Observable<Attraction> {
    return this.http.post<Attraction>(this.apiUrl, Attraction);
  }

  updateAttraction(id: number, Attraction: Attraction): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, Attraction);
  }

  deleteAttraction(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}