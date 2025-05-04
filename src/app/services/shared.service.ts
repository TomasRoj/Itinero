import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public dayCount = new BehaviorSubject<number>(0);
  days$ = this.dayCount.asObservable();
}
