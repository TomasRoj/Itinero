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

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss'],
  imports: [QuestionaireNavbarComponent, RouterLink, StepDatesComponent, StepDestinationComponent,StepNameComponent, StepInviteComponent, CommonModule]
})

export class SurveyComponent implements OnInit {
  constructor(private tripService: TripService, private router: Router) { }

  currentStep = 1;
  totalSteps = 4; // celkový počet kroků

  formData = {
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
  }; // zde budou data z celého dotazníku

  ngOnInit() {
     this.showStep(this.currentStep);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
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
    
    const newTrip: Trip = {
      name: this.formData.name,
      is_public: true, // nebo false podle potřeby
      created_at: new Date(), // aktuální datum
      updated_at: new Date(), // aktuální datum
      start_date: new Date(this.formData.startDate),
      end_date: new Date(this.formData.endDate),
      destination_city_id: 1, // change this
      creator_id: 1, // change this
    };
  
    // Volání POST metody
    this.tripService.createTrip(newTrip).subscribe({
      next: (response) => {
        console.log('Trip byl úspěšně vytvořen:', response);
        this.router.navigate(['/trip-itinerary']);
      },
      error: (error) => {
        console.error('Chyba při vytváření tripu:', error);
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
    if (stepData.startDate !== undefined) {
      this.formData.startDate = stepData.startDate;
    }
    if (stepData.endDate !== undefined) {
      this.formData.endDate = stepData.endDate;
    }

  }
}