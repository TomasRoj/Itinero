import { Component, OnInit } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { StepDatesComponent } from "./steps/step-dates/step-dates.component";
import { StepNameComponent } from "./steps/step-name/step-name.component";
import { StepDestinationComponent } from "./steps/step-destination/step-destination.component";
import { StepInviteComponent } from "./steps/step-invite/step-invite.component";
import { CommonModule } from '@angular/common'
import { RouterLink} from '@angular/router';
import { TripService } from '../../services/trip-service.service';
import { Trip } from '../../services/trip-service.service';
import { Router } from '@angular/router';
import { User, UserService } from '../../services/user-service.service';
import { SharedService } from '../../services/shared.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss'],
  imports: [QuestionaireNavbarComponent, RouterLink, StepDatesComponent, StepDestinationComponent,StepNameComponent, StepInviteComponent, CommonModule]
})

export class SurveyComponent implements OnInit {
  private apiUrl = 'http://localhost:5253/api';
  constructor(private tripService: TripService, private router: Router, private userService: UserService, private sharedService: SharedService, private http: HttpClient) { }

  currentStep = 1;
  totalSteps = 4; 

  formData = {
    name: '',
    destination: '',
    destinationId: 0,
    startDate: '',
    endDate: '',
  }; 

  ngOnInit() {
     this.showStep(this.currentStep);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.sharedService.continueButtonDisabled.value == false) {
           this.currentStep++;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  showStep(stepNumber: number) {
    this.currentStep = stepNumber;
  }

  submitSurvey() {
    console.log('Odeslaná data:', this.formData);
    
    this.userService.getCurrentUser().subscribe({
      next: (currentUser) => {
        const newTrip: Trip = {
          name: this.formData.name,
          is_public: true, 
          created_at: new Date(),
          updated_at: new Date(), 
          start_date: new Date(this.formData.startDate),
          end_date: new Date(this.formData.endDate),
          destination_city_id: this.formData.destinationId, // Now using the destinationId
          creator_id: currentUser.id 
        };

        this.tripService.createTrip(newTrip).subscribe({
          next: (response) => {
            console.log('Trip byl úspěšně vytvořen:', response);
            this.getTripByNameAndUserId(currentUser.id, this.formData.name).subscribe({
              next: (trip) => {
                if (trip) {
                  this.router.navigate(['/trip-itinerary/' + trip.id]);
                }
              }
            });
          },
          error: (error) => {
            console.error('Chyba při vytváření tripu:', error);
          }
        });
      },
      error: (err) => {
        console.error('Nepodařilo se načíst uživatele:', err);
      }
    });
  }

  updateFormData(stepData: any) {
    if (stepData.name !== undefined) {
      this.formData.name = stepData.name;
    }
    if (stepData.destination !== undefined) {
      this.formData.destination = stepData.destination;
    }
    if (stepData.destinationId !== undefined) {
      this.formData.destinationId = stepData.destinationId;
    }
    if (stepData.startDate !== undefined) {
      this.formData.startDate = stepData.startDate;
    }
    if (stepData.endDate !== undefined) {
      this.formData.endDate = stepData.endDate;
    }
  }

  getTripByNameAndUserId(userId: number, tripName: string): Observable<Trip | null> {
    return this.http.get<Trip[]>(`${this.apiUrl}/Trips/user/${userId}`).pipe(
      map(trips => {
        const normalizedSearchName = tripName.toLowerCase().trim();
        const foundTrip = trips.find(trip =>
          trip.name.toLowerCase().trim() === normalizedSearchName
        );

        return foundTrip || null;
      })
    );
  }

}