import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import {RouterLink, ActivatedRoute } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';
import { Component, Output, EventEmitter, HostListener} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, FormsModule],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {

  tripData: any = null;

  // Data
  @Output() changedDates = new EventEmitter<{startDate: string, endDate: string}>();
  startDate: string = '';
  endDate: string = '';

  // Zmena dat
  onDateChange() {
    this.changedDates.emit({ startDate: this.startDate, endDate: this.endDate });
    console.log('Změna data:', this.startDate, this.endDate);
  }

  openDropdown: string | null = null;

  toggleDropdown(dropdownId: string): void {
    this.openDropdown = this.openDropdown === dropdownId ? null : dropdownId;
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdown === dropdownId;
  }

  // Zavře dropdown, když klikneš mimo
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Zavři dropdown, pokud klik není uvnitř dropdownu ani tlačítka
    if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-button')) {
      this.openDropdown = null;
    }
  }

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
          const tripName = document.getElementById('tripName') as HTMLInputElement;
          const description = document.getElementById('descriptionField') as HTMLInputElement;

          startDate.placeholder = new Date(this.tripData.start_date).toDateString();
          endDate.placeholder = new Date(this.tripData.end_date).toDateString();
          destination.placeholder = this.tripData.destination_city_id.toString();
          tripName.placeholder = this.tripData.name.toString();
          description.placeholder = this.tripData.description.toString();
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
  }


  updateTripData() {
    
    const destination = document.getElementById('destinationName') as HTMLInputElement;
    const tripName = document.getElementById('tripName') as HTMLInputElement;
    const description = document.getElementById('descriptionField') as HTMLInputElement;

    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: tripName.value || this.tripData.name,
      destination_city_id:this.tripData.destination_city_id, // toto zmenit ppozdeji aby se menilo misto podle ID + naseptavac
      start_date: this.startDate ? new Date(this.startDate) : this.tripData.start_date,
      end_date: this.endDate ? new Date(this.endDate) : this.tripData.end_date,      
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: description.value || this.tripData.description,
    };

    interface Trip {
      id?: number;
      name: string;
      creator_id: number;
      destination_city_id: number;
      start_date: Date;
      end_date: Date;
      description?: string;
      is_public: boolean;
      created_at: Date;
      updated_at: Date;
    }

    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      

      this.tripService.updateTrip(tripId, updatedTrip).subscribe({
        next: (response) => {
          console.log('Trip updated successfully:', response);
          console.log('Aktualizovaná data výletu:', updatedTrip);

          // dodelat nejakej element kam se zobrazi succes hlaska, ze data byla updated

        },
        error: (error) => {
          console.error('Error updating trip:', error);
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

  removeUser(id: any) {
    console.log('Removing user for currency:', id);
    // Add your logic for removing a user
  }
  goBack(): void {
    console.log('Zpět');
  }

  addExpense(): void {
    console.log('Přidat výdaj');
  }

  showUsedCurrency(currency: string) {
    console.log('Showing used names for currency:', currency);
  }
}
