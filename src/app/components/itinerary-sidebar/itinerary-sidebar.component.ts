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
  
  @Input() activeDay: number = 1;  // Defaultně je první den aktivní
  @Output() daySelected = new EventEmitter<number>(); // Emitujeme den, na který bylo kliknuto
  
  ngOnInit() {
    // Sledujeme počet dní z hlavní komponenty
    this.sharedService.dayCount.subscribe(dayCount => {
      this.navigationItems = Array.from({ length: dayCount }, (_, i) => ({
        name: `Den ${i + 1}`,
        href: '#',  // Používáme '#' místo plné URL, protože jen měníme záložku, ne stránku
        dayNumber: i + 1
      }));
    });
    
    // Sledujeme změny aktivního dne z hlavní komponenty
    this.sharedService.selectedDay.subscribe(dayNumber => {
      if (dayNumber) {
        this.activeDay = dayNumber;
      }
    });
  }
  
  selectDay(day: number): void {
    this.activeDay = day;
    
    // Emitujeme událost pro rodičovskou komponentu
    this.daySelected.emit(day);
    
    // Aktualizujeme vybraný den v shared service pro ostatní komponenty
    this.sharedService.selectedDay.next(day);
    this.sharedService.setActiveTab('rozvrzeni');

    console.log('Vybraný den:', day);
  }
}