import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistraceComponent } from './pages/registrace/registrace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AttractionInfoComponent } from './pages/attraction-info/attraction-info.component';
import { SurveyComponent } from './pages/survey/survey.component';
import { InspirationAttractionsComponent } from './pages/inspiration-attractions/inspiration-attractions.component';
import { InspirationDestinationsComponent } from './pages/inspiration-destinations/inspiration-destinations.component';
import { JoinGroupComponent } from './pages/join-group/join-group.component';


export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'login', component: LoginComponent},
    { path: 'register', component: RegistraceComponent},
    { path: 'survey', component: SurveyComponent},
    { path: 'settings', component: SettingsComponent},
    { path: 'attractions', component: InspirationAttractionsComponent},
    { path: 'destinations', component: InspirationDestinationsComponent},
    { path: 'join-group', component: JoinGroupComponent},
    { path: 'attractioninfo', component: AttractionInfoComponent},

];
    