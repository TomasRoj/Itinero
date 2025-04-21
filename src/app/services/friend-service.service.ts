import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'http://localhost:5253/api/Friends';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  addFriend(friendId: string): Observable<Friend> {
    return this.http.post<Friend>(this.apiUrl, { friendId }, { headers: this.getAuthHeaders() });
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${friendId}`, { headers: this.getAuthHeaders() });
  }
}