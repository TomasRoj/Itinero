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

  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }
  
  selectDay(dayNumber: number): void {
    this.selectedDay.next(dayNumber);
  }
}
