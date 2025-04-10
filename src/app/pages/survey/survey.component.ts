import { Component, OnInit } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { StepDatesComponent } from "./steps/step-dates/step-dates.component";
import { StepDestinationComponent } from "./steps/step-destination/step-destination.component";
import { StepInviteComponent } from "./steps/step-invite/step-invite.component";
import { CommonModule } from '@angular/common'
import { RouterLink} from '@angular/router';


@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss'],
  imports: [QuestionaireNavbarComponent, RouterLink, StepDatesComponent, StepDestinationComponent, StepInviteComponent, CommonModule]
})
export class SurveyComponent implements OnInit {

  currentStep = 1;
  totalSteps = 3; // celkový počet kroků
  formData = {}; // zde budou data z celého dotazníku

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
    // odeslani na server
  }

  updateFormData(stepData: any) {
    this.formData = { ...this.formData, ...stepData };
  }
}