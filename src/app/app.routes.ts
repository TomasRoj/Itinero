import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/registrace/registrace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AttractionInfoComponent } from './pages/attraction-info/attraction-info.component';
import { SurveyComponent } from './pages/survey/survey.component';
import { EditExpenseComponent } from './pages/edit-expense/edit-expense.component';
import { InspirationAttractionsComponent } from './pages/inspiration-attractions/inspiration-attractions.component';
import { InspirationDestinationsComponent } from './pages/inspiration-destinations/inspiration-destinations.component';
import { JoinGroupComponent } from './pages/join-group/join-group.component';
import { TripItineraryComponent } from './pages/trip-itinerary/trip-itinerary.component';
import { AddExpenseComponent } from './pages/add-expense/add-expense.component';
import { DayItineraryComponent } from './pages/day-itinerary/day-itinerary.component';
import { FriendsComponent } from './pages/friends/friends.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent},
    { path: 'registrace', component: RegisterComponent},

    {path: '', canActivate: [AuthGuard], children: [
        { path: '', component: DashboardComponent },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'survey', component: SurveyComponent},
        { path: 'settings', component: SettingsComponent},
        { path: 'attractions', component: InspirationAttractionsComponent},
        { path: 'destinations', component: InspirationDestinationsComponent},
        { path: 'join-group', component: JoinGroupComponent},
        { path: 'attractioninfo/:id', component: AttractionInfoComponent},
        { path: 'trip-itinerary', component: TripItineraryComponent},
        { path: 'trip/:tripId/expenses/add', component: AddExpenseComponent},
        { path: 'trip/:tripId/expenses/edit-expense/:expenseId', component: EditExpenseComponent},
        { path: 'day-itinerary', component: DayItineraryComponent},
        { path: 'friends', component: FriendsComponent},
    ]},

    // Dynamic
    { path: 'trip-itinerary/:id', component: TripItineraryComponent},
    {path: '**', redirectTo: '/login'}
];