import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  activeDay: number = 1;

  constructor (
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.updateDayDescription();
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
