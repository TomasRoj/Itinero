import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Params } from '@angular/router';
import { SharedService } from '../../../../services/shared.service';
import { Observable } from 'rxjs';
import { switchMap, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface TripItem {
  id: number;
  itinerary_day_id: number;
  attraction_id: number;
  trip_id: number;
  name: string;
  description: string;
  custom_location: string;
  latitude: number;
  longitude: number;
  estimatedtime: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
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

  currentDayItems: TripItem[] = [];
  currentDayData: ItineraryDay | null = null;
  private apiUrl = 'http://localhost:5253/api';
  itineraryDays: ItineraryDay[] = [];
  dayDescription: string = '';
  selectedDay: number = 1;
  saveSuccess: string = '';

  activities: TripItem[] = [];

  params: any = {};

  constructor(
    private http: HttpClient,
    public route: ActivatedRoute,
    private sharedService: SharedService
  ) { }

  // Vrací skutečné ID dne podle pořadí selectedDay (1,2,3...)
  getSelectedDayId(): number | null {
    if (this.itineraryDays.length === 0) return null;
    const day = this.itineraryDays[this.selectedDay - 1];
    return day ? day.id : null;
  }

  getTripItemsByDayAndTrip(dayId: number, tripId: number): Observable<TripItem[]> {
    // Získáme všechny dny patřící danému tripu
    return this.http.get<ItineraryDay[]>(`${this.apiUrl}/Itinerary/days?tripId=${tripId}`).pipe(
      tap(days => {
        console.log(`Načteno ${days.length} dní pro tripId=${tripId}:`, days);
      }),
      switchMap(days => {
        // Ověříme, že den skutečně patří k danému tripu
        const matchingDay = days.find(day => day.id === dayId);

        if (!matchingDay) {
          // Den k tripu nepatří – vracíme prázdné pole
          return of([]);
        }

        // Den je validní – stáhneme itemy pro tento den
        const params = new HttpParams().set('dayId', dayId.toString());
        return this.http.get<TripItem[]>(`${this.apiUrl}/Itinerary/items`, { params });
      })
    );
  }


  // Vypocty na zaklade pridanych aktivit
  get totalActivities(): number {
    return this.activities.length;
  }

  get totalDuration(): number {
    return this.activities.reduce((sum, activity) => {
      const hours = parseFloat(activity.estimatedtime.replace('H', '').replace(',', '.'));
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params): void => {
      const tripId: number = +params['id'];
      this.loadItineraryDays(tripId);

      const dayId = this.getSelectedDayId();
      if (dayId !== null) {
        this.getTripItemsByDayAndTrip(dayId, tripId).subscribe({
          next: items => this.activities = items,
          error: error => console.error('Chyba při načítání aktivit:', error)
        });
      }
    });

    this.sharedService.selectedDay.subscribe((day: number) => {
      this.selectedDay = day;
      this.loadItineraryDays(this.sharedService.tripId.getValue());
    });
  }

  loadItineraryDays(tripId: number): void {
    const params = new HttpParams().set('tripId', String(tripId));

    this.http.get<ItineraryDay[]>(`${this.apiUrl}/Itinerary/days`, { params }).subscribe({
      next: (days) => {
        this.itineraryDays = days
          .filter(day => day.trip_id === tripId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const selectedDayObj = this.itineraryDays[this.selectedDay - 1] ?? null;

        if (selectedDayObj) {
          this.currentDayData = selectedDayObj;
          this.dayDescription = selectedDayObj.description || '';
          this.getTripItemsByDayAndTrip(selectedDayObj.id, tripId).subscribe({
            next: items => {
              this.activities = items;
            },
            error: error => {
              console.error('Chyba při načítání aktivit:', error);
            }
          });
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
    this.saveSuccess = 'Změny byly úspěšně uloženy.';

    this.http.put<ItineraryDay>(
      `${this.apiUrl}/Itinerary/day/${this.currentDayData.id}`,
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

  removeActivity(activityId: number): void {
    this.http.delete(`${this.apiUrl}/Itinerary/item/${activityId}`).subscribe({
      next: () => {
        this.activities = this.activities.filter(item => item.id !== activityId);
        console.log(`Aktivita s ID ${activityId} byla úspěšně odstraněna.`);
      },
      error: (error) => {
        console.error('Chyba při odstraňování aktivity:', error);
      }
    });
  }

}
