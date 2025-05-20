import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AttractionService, Attraction } from '../../services/attraction-service.service';
import { map } from 'rxjs/operators';
import { TripService } from '../../services/trip-service.service';

@Component({
  selector: 'app-day-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './day-itinerary.component.html',
  styleUrl: './day-itinerary.component.scss'
})
export class DayItineraryComponent {
  apiUrl: string = 'http://localhost:5253/api';
  itineraryForm: FormGroup;
  tripId: number = 0;
  itineraryDayId: number = 0;

  attractions: Attraction[] = [];
  addedAttractionIds: number[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private fb: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private router: Router, private attractionService: AttractionService, private tripService: TripService) {
    this.itineraryForm = this.fb.group({
      name: ['', Validators.required],
      custom_location: [''],
      description: ['', Validators.required],
      estimatedtime: ['', [Validators.required, Validators.min(0)]],
      sort_order: [0]
    });
  }

  ngOnInit(): void {
    this.tripId = +this.route.snapshot.queryParamMap.get('tripId')!;
    this.itineraryDayId = +this.route.snapshot.queryParamMap.get('dayId')!;
    console.log('Trip ID:', this.tripId);
    console.log('Day ID:', this.itineraryDayId);
    this.loadCityIdAndAttractions();
  }

  submitDayItinerary(): void {
    const dayId = Number(this.route.snapshot.queryParamMap.get('dayId'));
    if (!dayId) {
      console.error('Chybí dayId v URL parametrech');
      return;
    }

    if (this.itineraryForm.invalid) {
      console.error('Formulář není validní');
      return;
    }

    const formValue = this.itineraryForm.value;

    const payload = {
      itinerary_day_id: dayId,
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      custom_location: formValue.custom_location.trim() || '',
      latitude: 0,
      longitude: 0,
      estimatedtime: formValue.estimatedtime.toString(),
      sort_order: formValue.sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.http.post(`${this.apiUrl}/Itinerary/Item`, payload).subscribe({
      next: () => {
        console.log('Den byl úspěšně uložen.');
      },
      error: (err) => {
        console.error('Chyba při ukládání dne:', err);
      }
    });
  }

  loadAttractionsByCity(cityId: number): void {
    this.subscription.add(
      this.attractionService.getAttractions()
        .pipe(
          map(attractions => attractions.filter(attraction => attraction.city_id === cityId))
        )
        .subscribe({
          next: (filteredAttractions) => {
            this.attractions = filteredAttractions;
            console.log('Načtené atrakce:', this.attractions);
          },
          error: (error) => {
            console.error('Chyba při získávání atrakcí:', error);
          }
        })
    );
  }

  loadCityIdAndAttractions(): void {
    if (!this.tripId) {
      console.error('Chybí tripId');
      return;
    }

    this.tripService.getTripById(this.tripId).subscribe({
      next: (trip) => {
        const cityId = trip.destination_city_id;

        if (!cityId) {
          console.error('Trip neobsahuje city_id');
          return;
        }

        console.log(`Načítám atrakce pro město s ID: ${cityId}`);

        this.loadAttractionsByCity(cityId);
      },
      error: (error) => {
        console.error('Chyba při získávání informací o tripu:', error);
      }
    });
  }

  addAttractionToDayItinerary(attraction: Attraction): void {
    const dayId = this.itineraryDayId;

    if (!dayId) {
      console.error('Chybí dayId v komponentě');
      return;
    }

    const payload = {
      itinerary_day_id: dayId,
      name: attraction.name,
      description: attraction.description || 'Bez popisu',
      custom_location: attraction.address || '',
      latitude: attraction.latitude || 0,
      longitude: attraction.longitude || 0,
      estimatedtime: attraction.estimated_visit_time?.toString() || '60',
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attraction_id: attraction.id
    };

    this.http.post(`${this.apiUrl}/Itinerary/Item`, payload).subscribe({
      next: (response) => {
        console.log('Atrakce byla úspěšně přidána do itineráře:', response);
        alert(`Atrakce "${attraction.name}" byla přidána do denního plánu.`);
      },
      error: (err) => {
        console.error('Chyba při přidávání atrakce do itineráře:', err);
        alert('Při přidávání atrakce došlo k chybě. Zkuste to prosím znovu.');
      }
    });
  }

  isAttractionAdded(attractionId: number): boolean {
    return this.addedAttractionIds.includes(attractionId);
  }

}
