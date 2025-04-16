import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import {RouterLink, ActivatedRoute } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {

  tripData: any = null;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
  ) { }

  ngOnInit(): void {
    // Získání ID z URL parametru
    this.route.params.subscribe(params => {
      const tripId = +params['id']; // Konverze na číslo
      
      // Načtení dat podle ID
      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = response;
          const startDate = document.getElementById('startDate') as HTMLInputElement;
          const endDate = document.getElementById('endDate') as HTMLInputElement;
          const destination = document.getElementById('destinationName') as HTMLInputElement;

          startDate.placeholder = new Date(this.tripData.start_date).toDateString();
          endDate.placeholder = new Date(this.tripData.end_date).toDateString();
          destination.placeholder = this.tripData.destination_city_id.toString(); // Zde byste měli mít mapování na název města
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
  }


  // Staticke data
  activeTab = 'destinace'; // Nastaveno jako výchozí záložka "Členové výletu"
  
  // Ukázková data pro členy výletu
  groupId = 'T26BLQ';
  groupMembers = [
    { name: 'Kája Horáková', role: 'Vlastník', avatar: 'assets/avatars/user1.jpg' },
    { name: 'Honza Novák', role: 'Member', avatar: 'assets/avatars/user2.jpg' },
    { name: 'Tomáš Veselý', role: 'Member', avatar: 'assets/avatars/user3.jpg' }
  ];
  
  expenses = [
    {
      id: 1,
      description: 'Večeře na Maltě',
      paidBy: 'Tomáš Veselý',
      date: new Date('2025-04-05'),
      amount: 1250,
      currency: 'Kč',
      isSettled: true
    },
    {
      id: 2,
      description: 'Vodní skútr',
      paidBy: 'Honza Novák',
      date: new Date('2025-04-04'),
      amount: 3500,
      currency: 'Kč',
      isSettled: true
    },
    {
      id: 3,
      description: 'Letenky',
      paidBy: 'Pepa Petrovský',
      date: new Date('2025-04-01'),
      amount: 8700,
      currency: 'Kč',
      isSettled: false
    }
  ];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  transferOwnership(): void {
    console.log('Předat vlastnictví');
  }

  removeUser(): void {
    console.log('Odstranit uživatele');
  }

  showUsedNames(): void {
    console.log('Zobrazit používaná jména');
  }

  goBack(): void {
    console.log('Zpět');
  }

  confirm(): void {
    console.log('Potvrzeno');
  }

  addExpense(): void {
    console.log('Přidat výdaj');
  }
}
