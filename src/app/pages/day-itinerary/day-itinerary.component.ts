import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';


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

  constructor(private fb: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private router: Router) {
    this.itineraryForm = this.fb.group({
      name: ['', Validators.required],
      custom_location: [''],
      description: ['', Validators.required],
      estimatedtime: ['', [Validators.required, Validators.min(0)]],
      sort_order: [0]
    });
  }

  ngOnInit(): void {
    this.tripId = +this.route.snapshot.params['tripId'];
    this.itineraryDayId = +this.route.snapshot.params['dayId'];
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
}
