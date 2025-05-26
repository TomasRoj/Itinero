import { CommonModule } from '@angular/common';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Trip, TripService } from '../../services/trip-service.service';
import { TripMemberService } from '../../services/trip-member.service';
import { UserService } from '../../services/user-service.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../services/shared.service';
import { HttpParams } from '@angular/common/http';
import { ExpenseSplit, ExpenseService } from '../../services/finance-service.service';
import { Router } from '@angular/router';
import { DestinationTabComponent } from './tabs/destination-tab/destination-tab.component';
import { MembersTabComponent } from './tabs/members-tab/members-tab.component';
import { FinanceTabComponent } from "./tabs/finance-tab/finance-tab.component";
import { DaysTabComponent } from "./tabs/days-tab/days-tab.component";

interface ItineraryDay {
  id: number;
  trip_id: number;
  description?: string;
  date: Date;
}

interface ItineraryItem {
  id: number;
  day_id: number;
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

@Component({
  selector: 'app-trip-itinerary',
  imports: [CommonModule, ItinerarySidebarComponent, RouterLink, FormsModule, DestinationTabComponent, MembersTabComponent, FinanceTabComponent, DaysTabComponent],
  templateUrl: './trip-itinerary.component.html',
  styleUrl: './trip-itinerary.component.scss'
})
export class TripItineraryComponent {
  placeholders: {
    startDate: string;
    endDate: string;
    destination: string;
    tripName: string;
    description: string;
  } = {
      startDate: '',
      endDate: '',
      destination: '',
      tripName: '',
      description: ''
    };

  tripForm = {
    startDate: '',
    endDate: '',
    destination: '',
    tripName: '',
    description: ''
  };

  tripData: any = null;
  activeDay: number = 1;
  itineraryDays: ItineraryDay[] = [];
  currentDayItems: ItineraryItem[] = [];
  currentDayData: ItineraryDay | null = null;

  private isCreatingDays = false;
  dayDescription: string = '';

  newItem: {
    name: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
  } = {
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      location: ''
    };

  // API base URL
  private apiBaseUrl = 'http://localhost:5253/api';

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private tripMemberService: TripMemberService,
    private userService: UserService,
    private http: HttpClient,
    private sharedService: SharedService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tripId = +params['id'];
      let dayCount: number = 0;

      this.sharedService.activeTab$.subscribe(tab => {
        this.activeTab = tab;
      });

      this.loadItineraryDays(tripId);

      this.tripService.getTripById(tripId).subscribe({
        next: (response: Trip) => {
          this.tripData = {
            ...response,
            description: response.description || 'Zatím žádný popis'
          };

          let dayCount = 0;
          dayCount = Math.floor(
            (new Date(this.tripData.end_date).getTime() - new Date(this.tripData.start_date).getTime()) /
            (1000 * 3600 * 24)
          ) + 1;
          this.sharedService.dayCount.next(dayCount);

        },
        error: (error: any) => {
          console.error('Chyba při načítání dat výletu:', error);
        }
      });
    });

    this.sharedService.selectedDay.subscribe(dayNumber => {
      if (dayNumber && this.tripData) {
        this.changeActiveDay(dayNumber);
      }
    });
  }

  loadItineraryDays(tripId: number): void {
    const params = new HttpParams().set('tripId', String(tripId))

    this.http.get<ItineraryDay[]>(`${this.apiBaseUrl}/Itinerary/days`, { params }).subscribe({
      next: (days) => {
        console.log('Načtené dny z API:', days);
        this.itineraryDays = days
          .filter(day => day.trip_id === tripId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (this.itineraryDays.length === 0) {
          console.log('Vytvářím nové dny pro výlet');
          this.createInitialDays(tripId);
        } else {
          this.changeActiveDay(1);
          const dayCount = this.itineraryDays.length;
          this.sharedService.dayCount.next(dayCount);
          if (this.sharedService.tripId) {
            this.sharedService.tripId.next(tripId);
          }
        }
      },
      error: (error) => {
        console.error('Chyba při načítání dnů itineráře:', error);
      }
    });
  }


  async createInitialDays(tripId: number): Promise<void> {
    if (this.isCreatingDays) return;
    this.isCreatingDays = true;

    try {

      if (!this.tripData) {
        console.error('Trip data nejsou dostupná.');
        this.isCreatingDays = false;
        return;
      }
      const startDate = new Date(this.tripData.start_date);
      const endDate = new Date(this.tripData.end_date);
      const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

      const createDayPromises = [];
      for (let i = 1; i <= dayCount; i++) {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + (i - 1));
        const formattedDate = currentDayDate.toISOString().split('T')[0];

        const dayData = {
          trip_id: tripId,
          day_number: i,
          description: `Den ${i} výletu ${this.tripData.name} (${formattedDate})`,
          date: formattedDate
        };
        createDayPromises.push(
          this.http.post<ItineraryDay>(`${this.apiBaseUrl}/Itinerary/day`, dayData).toPromise()
        );
      }
      await Promise.all(createDayPromises);

      this.isCreatingDays = false;
      this.loadItineraryDays(tripId);
    } catch (error) {
      console.error('Chyba při vytváření dnů itineráře:', error);
      this.isCreatingDays = false;
    }
  }

  changeActiveDay(dayNumber: number): void {
    this.activeDay = dayNumber;

    // Ověření, že den existuje
    const selectedDay = this.itineraryDays[dayNumber - 1];
    if (selectedDay) {
      this.currentDayData = selectedDay;
      this.dayDescription = selectedDay.description || '';
      this.loadDayItems(selectedDay.id);
    } else {
      this.currentDayData = null;
      this.currentDayItems = [];
      this.dayDescription = '';
    }
  }

  loadDayItems(dayId: number): void {

  }

  loadingExpenses: boolean = false;
  expenseSplits: ExpenseSplit[] = [];
  typedUserId: string = '';
  activeTab = 'destinace';
  groupId = 'd516';
  newOwnerId: string = '';
  expenses: any[] = [];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

}