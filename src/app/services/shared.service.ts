import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  constructor() {}

  // Method to update the active tab
  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }
  
  // Method to update the selected day
  selectDay(dayNumber: number): void {
    this.selectedDay.next(dayNumber);
  }
}
