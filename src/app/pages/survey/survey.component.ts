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
import { UserService } from '../../services/user-service.service';
import { SharedService } from '../../services/shared.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TripMemberService } from '../../services/trip-member.service';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss'],
  imports: [QuestionaireNavbarComponent, RouterLink, StepDatesComponent, StepDestinationComponent,StepNameComponent, StepInviteComponent, CommonModule]
})

export class SurveyComponent implements OnInit {
  private apiUrl = 'http://localhost:5253/api';
  constructor(private tripService: TripService, private router: Router, private userService: UserService, private sharedService: SharedService, private http: HttpClient, private tripMemberService: TripMemberService) { }

  currentStep = 1;
  totalSteps = 4; 

  selectedFriendId: string = '';
  private friendIdSubscription?: Subscription;

  formData = {
    name: '',
    destination: '',
    destinationId: 0,
    startDate: '',
    endDate: '',
  }; 

  ngOnInit() {
     this.showStep(this.currentStep);
     this.friendIdSubscription = this.sharedService.friendId$.subscribe(
      friendId => {
        this.selectedFriendId = friendId;
        console.log('Survey: Friend ID updated to:', friendId);
      }
    );
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
  
  // Získání friend ID ze service
  const friendId = this.sharedService.getFriendId();
  console.log('Selected Friend ID:', friendId);

  this.userService.getCurrentUser().subscribe({
    next: (currentUser) => {
      const newTrip: Trip = {
        name: this.formData.name,
        is_public: true, 
        created_at: new Date(),
        updated_at: new Date(), 
        start_date: new Date(this.formData.startDate),
        end_date: new Date(this.formData.endDate),
        destination_city_id: this.formData.destinationId,
        creator_id: currentUser.id 
      };

      // 1. Vytvoření tripu
      this.tripService.createTrip(newTrip).subscribe({
        next: (response) => {
          console.log('Trip byl úspěšně vytvořen:', response);
          
          // 2. Získání vytvořeného tripu
          this.getTripByNameAndUserId(currentUser.id, this.formData.name).subscribe({
            next: (trip) => {
              if (trip && trip.id !== undefined) {
                
                // 3. Přidání vlastníka jako člena tripu
                this.tripMemberService.addTripMember(trip.id, currentUser.id, 'Vlastník').subscribe({
                  next: () => {
                    console.log('Owner added as trip member');
                    
                    // 4. Přidání přítele (pokud je zadán)
                    this.addFriendToTrip(trip.id!, friendId, () => {
                      // 5. Přesměrování po úspěšném dokončení
                      this.router.navigate(['/trip-itinerary/' + trip.id]);
                    });
                  },
                  error: (error) => {
                    console.error('Chyba při přidávání vlastníka:', error);
                    // I při chybě zkusíme přidat přítele a přesměrovat
                    this.addFriendToTrip(trip.id!, friendId, () => {
                      this.router.navigate(['/trip-itinerary/' + trip.id]);
                    });
                  }
                });
                
              } else {
                console.error('Trip ID is undefined.');
              }
            },
            error: (error) => {
              console.error('Chyba při získávání tripu:', error);
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

private addFriendToTrip(tripId: number, friendId: string, callback: () => void): void {
  if (!friendId || friendId.trim() === '') {
    console.log('No friend ID provided, skipping friend addition');
    callback();
    return;
  }

  const friendIdNum = parseInt(friendId, 10);
  
  if (isNaN(friendIdNum)) {
    console.error('Invalid friend ID:', friendId);
    alert('Neplatné ID přítele');
    callback();
    return;
  }

  console.log(`Adding friend ${friendIdNum} to trip ${tripId}`);
  
  this.tripMemberService.addTripMember(tripId, friendIdNum, "Member").subscribe({
    next: () => {
      console.log('Friend added successfully');
      alert('Přítel byl úspěšně přidán do výletu!');
      
      this.sharedService.clearFriendId();
      
      callback();
    },
    error: (error) => {
      console.error('Error adding friend:', error);
      alert('Nepodařilo se přidat přítele do výletu.');
      callback();
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