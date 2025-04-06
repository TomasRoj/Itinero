import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';

@Component({
  selector: 'app-day-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent],
  templateUrl: './day-itinerary.component.html',
  styleUrl: './day-itinerary.component.scss'
})
export class DayItineraryComponent {
  attractionSource: 'database' | 'custom' = 'database';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  selectAttractionSource(source: 'database' | 'custom'): void {
    this.attractionSource = source;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
