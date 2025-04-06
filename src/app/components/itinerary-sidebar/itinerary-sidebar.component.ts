import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-itinerary-sidebar',
  imports: [CommonModule, RouterLink],
  templateUrl: './itinerary-sidebar.component.html',
  styleUrl: './itinerary-sidebar.component.scss'
})
export class ItinerarySidebarComponent {
  navigationItems = [
    { name: 'Den 1', href: '/trip-itinerary' },
    { name: 'Den 2', href: '/trip-itinerary' },
    { name: 'Den 3', href: '/trip-itinerary' },
    { name: 'Den 4', href: '/trip-itinerary' },
  ];
}
