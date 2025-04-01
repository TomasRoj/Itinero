import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistraceComponent } from './pages/registrace/registrace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

//Survey
import { SurveyComponent } from './pages/survey/survey.component';
import { StepDestinationComponent } from './pages/survey/steps/step-destination/step-destination.component';  
import { StepDatesComponent } from './pages/survey/steps/step-dates/step-dates.component';
import { StepInviteComponent } from './pages/survey/steps/step-invite/step-invite.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'Login', component: LoginComponent},
    { path: 'Register', component: RegistraceComponent},
    { path: 'Survey', component: SurveyComponent}
];
