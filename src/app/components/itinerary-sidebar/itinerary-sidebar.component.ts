import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-itinerary-sidebar',
  imports: [CommonModule, RouterLink],
  templateUrl: './itinerary-sidebar.component.html',
  styleUrl: './itinerary-sidebar.component.scss'
})
export class ItinerarySidebarComponent {
  navigationItems: { name: string; href: string }[] = [];

  constructor(private sharedService: SharedService) {}

  ngOnInit() {
    this.sharedService.dayCount.subscribe(dayCount => {
      this.navigationItems = Array.from({ length: dayCount }, (_, i) => ({
        name: `Den ${i + 1}`,
        href: '/trip-itinerary',
      }));
    });
  }
}
