import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public dayCount = new BehaviorSubject<number>(0);
  days$ = this.dayCount.asObservable();

  selectedDay = new BehaviorSubject<number>(1);
  tripId = new BehaviorSubject<number>(0);
  private activeTabSubject = new BehaviorSubject<string>('destinace');
  activeTab$ = this.activeTabSubject.asObservable();

  public continueButtonDisabled = new BehaviorSubject<boolean>(true);

  formData = {
    name: '',
    destination: '',
    destinationId: 0,
    startDate: '',
    endDate: '',
  }; 

  constructor() {}

  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }
  
  selectDay(dayNumber: number): void {
    this.selectedDay.next(dayNumber);
  }

  private friendIdSubject = new BehaviorSubject<string>('');
  
  friendId$: Observable<string> = this.friendIdSubject.asObservable();

  setFriendId(friendId: string): void {
    this.friendIdSubject.next(friendId);
    console.log('Service: Friend ID set to:', friendId);
  }

  getFriendId(): string {
    return this.friendIdSubject.value;
  }

  clearFriendId(): void {
    this.friendIdSubject.next('');
  }
  
}
