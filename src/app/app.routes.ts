import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistraceComponent } from './pages/registrace/registrace.component';

export const routes: Routes = [
    { path: 'Login', component: LoginComponent},
    { path: 'Register', component: RegistraceComponent}
];
