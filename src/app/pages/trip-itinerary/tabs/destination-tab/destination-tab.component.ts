import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TripService } from '../../../../services/trip-service.service';
import { Trip } from '../../../../services/trip-service.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-destination-tab',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './destination-tab.component.html',
  styleUrl: './destination-tab.component.scss'
})
export class DestinationTabComponent {

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
  ) { }

  tripData: any = null;
  private apiBaseUrl = 'http://localhost:5253/api';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];

      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = response;

          this.placeholders = {
            startDate: new Date(this.tripData.start_date).toDateString(),
            endDate: new Date(this.tripData.end_date).toDateString(),
            destination: this.tripData.destination_city_id.toString(),
            tripName: this.tripData.name.toString(),
            description: this.tripData.description.toString()
          };

          let dayCount = 0;
          dayCount = Math.floor(
            (new Date(this.tripData.end_date).getTime() - new Date(this.tripData.start_date).getTime()) /
            (1000 * 3600 * 24)
          ) + 1;
        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });
  }

  placeholders: {
    startDate: string;
    endDate: string;
    destination: string;
    tripName: string;
    description: string;
  } = {
      startDate: '',
      endDate: '',
      destination: '',
      tripName: '',
      description: ''
    };

  tripForm = {
    startDate: '',
    endDate: '',
    destination: '',
    tripName: '',
    description: ''
  };

  newItem: {
    name: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
  } = {
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      location: ''
    };

  @Output() changedDates = new EventEmitter<{ startDate: string, endDate: string }>();
  startDate: string = '';
  endDate: string = '';

  openDropdown: string | null = null;

  toggleDropdown(dropdownId: string): void {
    this.openDropdown = this.openDropdown === dropdownId ? null : dropdownId;
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdown === dropdownId;
  }

  onDateChange() {
    this.changedDates.emit({ startDate: this.startDate, endDate: this.endDate });
    console.log('Změna data:', this.startDate, this.endDate);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-button')) {
      this.openDropdown = null;
    }
  }

  updateTripData() {
    const updatedTrip: Trip = {
      id: this.tripData.id,
      name: this.tripForm.tripName || this.tripData.name,
      destination_city_id: this.tripData.destination_city_id,
      start_date: this.tripForm.startDate ? new Date(this.tripForm.startDate) : this.tripData.start_date,
      end_date: this.tripForm.endDate ? new Date(this.tripForm.endDate) : this.tripData.end_date,
      creator_id: this.tripData.creator_id,
      is_public: this.tripData.is_public,
      created_at: this.tripData.created_at,
      updated_at: new Date(),
      description: this.tripForm.description || this.tripData.description,
    };

    const tripId = this.route.snapshot.params['id'];

    this.tripService.updateTrip(tripId, updatedTrip).subscribe({
      next: (response) => {
        console.log('Trip updated successfully:', response);
        console.log('Updated trip data:', updatedTrip);

        this.tripData = { ...updatedTrip };
        this.updatePlaceholders();
      },
      error: (error) => {
        console.error('Error updating trip:', error);
      }
    });
  }

  updatePlaceholders() {
    this.placeholders = {
      startDate: new Date(this.tripData.start_date).toDateString(),
      endDate: new Date(this.tripData.end_date).toDateString(),
      destination: this.tripData.destination_city_id.toString(),
      tripName: this.tripData.name.toString(),
      description: this.tripData.description.toString()
    };
  }

}
