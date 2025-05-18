import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Params } from '@angular/router';
import { SharedService } from '../../../../services/shared.service';

interface ItineraryItem {
  id: number;
  day_id: number;
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

interface ItineraryDay {
  id: number;
  trip_id: number;
  description?: string;
  date: Date;
}

@Component({
  selector: 'app-days-tab',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './days-tab.component.html',
  styleUrl: './days-tab.component.scss'
})

export class DaysTabComponent {

  currentDayItems: ItineraryItem[] = [];
  currentDayData: ItineraryDay | null = null;
  private apiBaseUrl = 'http://localhost:5253/api';
  itineraryDays: ItineraryDay[] = [];
  dayDescription: string = '';
  selectedDay: number = 1;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params): void => {
      const tripId: number = +params['id'];
      this.loadItineraryDays(tripId);
    });

    this.sharedService.selectedDay.subscribe((day: number) => {
      this.selectedDay = day;
      this.loadItineraryDays(this.sharedService.tripId.getValue());
    });
  }

 loadItineraryDays(tripId: number): void {
  const params = new HttpParams().set('tripId', String(tripId));

  this.http.get<ItineraryDay[]>(`${this.apiBaseUrl}/Itinerary/days`, { params }).subscribe({
    next: (days) => {
      console.log('Načtené dny z API:', days);
      this.itineraryDays = days
        .filter(day => day.trip_id === tripId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Nastavení aktivního dne – např. první den v seznamu nebo podle selectedDay
      const selectedDay = this.itineraryDays[this.selectedDay - 1] ?? null;

      if (selectedDay) {
        this.currentDayData = selectedDay;
        this.dayDescription = selectedDay.description || '';
      } else {
        this.currentDayData = null;
        this.dayDescription = '';
      }
    },
    error: (error) => {
      console.error('Chyba při načítání dnů itineráře:', error);
    }
  });
}


  updateDayDescription(): void {
    if (!this.currentDayData) return;

    this.currentDayData.description = this.dayDescription;

    this.http.put<ItineraryDay>(
      `${this.apiBaseUrl}/Itinerary/day/${this.currentDayData.id}`,
      this.currentDayData
    ).subscribe({
      next: (updatedDay) => {
        const idx = this.itineraryDays.findIndex(d => d.id === updatedDay.id);
        if (idx !== -1) this.itineraryDays[idx] = updatedDay;
      },
      error: (err) => {
        console.error('Chyba při ukládání popisu dne:', err);
      }
    });
  }
}
