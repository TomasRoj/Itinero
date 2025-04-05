import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {
  activeTab = 'destinace'; // Nastaveno jako výchozí záložka "Členi výletu"
  
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

  ngOnInit(): void {
  }

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
