import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistraceComponent } from './pages/registrace/registrace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsComponent } from './pages/settings/settings.component';


export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'Login', component: LoginComponent},
    { path: 'Register', component: RegistraceComponent},
    { path: 'Settings', component: SettingsComponent},

];
    