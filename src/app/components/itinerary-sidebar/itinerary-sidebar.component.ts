import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-itinerary-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './itinerary-sidebar.component.html',
  styleUrl: './itinerary-sidebar.component.scss'
})
export class ItinerarySidebarComponent implements OnInit {
  navigationItems: { name: string; href: string; dayNumber: number }[] = [];
  
  constructor(private sharedService: SharedService) {}
  
  @Input() activeDay: number = 1; 
  @Output() daySelected = new EventEmitter<number>(); 
  
  ngOnInit() {
    this.sharedService.dayCount.subscribe(dayCount => {
      this.navigationItems = Array.from({ length: dayCount }, (_, i) => ({
        name: `Den ${i + 1}`,
        href: '#', 
        dayNumber: i + 1
      }));
    });
    
    this.sharedService.selectedDay.subscribe(dayNumber => {
      if (dayNumber) {
        this.activeDay = dayNumber;
      }
    });
  }
  
  selectDay(day: number): void {
    this.activeDay = day;
    
    this.daySelected.emit(day);
    
    this.sharedService.selectedDay.next(day);
    this.sharedService.setActiveTab('rozvrzeni');

    console.log('Vybraný den:', day);
  }
}