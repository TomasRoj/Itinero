import { Component } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { CommonModule } from '@angular/common';
import { RouterLink} from '@angular/router';
import { TripMembersService } from '../../trip-member.service';
import { UserService } from '../../services/user-service.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-join-group',
  imports: [QuestionaireNavbarComponent, CommonModule, RouterLink],
  templateUrl: './join-group.component.html',
  styleUrl: './join-group.component.scss',
})
export class JoinGroupComponent {
  tripJoiner: TripJoiner; // Instance of TripJoiner
  tripId: string = ''; // Bind this variable to input field in HTML
  message: string = ''; // Message to display success/failure

  constructor(
    private tripMembersService: TripMembersService,
    private userService: UserService
  ) {
    // Initialize TripJoiner with services
    this.tripJoiner = new TripJoiner(this.tripMembersService, this.userService);
  }

  // Method to handle form submission
  async joinTrip() {
    const result = await this.tripJoiner.joinTrip('participant'); // Adjust the role as needed
    this.message = result.message; // Display success or error message
  }
}

export class TripJoiner {
  private tripMembersService: TripMembersService;
  private userService: UserService;
  
  constructor(
    tripMembersService: TripMembersService,
    userService: UserService
  ) {
    this.tripMembersService = tripMembersService;
    this.userService = userService;
  }
  
  public async joinTrip(role: string = 'participant'): Promise<{ success: boolean; message: string }> {
    try {
      // Get trip ID from input element
      const tripIdElement = document.getElementById('tripId_input') as HTMLInputElement;
      if (!tripIdElement) {
        return { success: false, message: 'Trip ID input element not found' };
      }
      
      const tripId = tripIdElement.value.trim();
      if (!tripId) {
        return { success: false, message: 'Please enter a Trip ID' };
      }
      
      // Parse trip ID to number
      const numericTripId = parseInt(tripId, 10);
      if (isNaN(numericTripId)) {
        return { success: false, message: 'Please enter a valid Trip ID number' };
      }
      
      // Get current user - convert Observable to Promise
      let currentUser;
      try {
        currentUser = await firstValueFrom(this.userService.getCurrentUser());
        
        if (!currentUser || !currentUser.id) {
          return { 
            success: false, 
            message: 'Could not retrieve user information' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: 'You must be logged in to join a trip' 
        };
      }
      
      // Add user to trip
      await this.tripMembersService.addMemberToTrip(numericTripId, {
        user_id: currentUser.id,
        role: role
      });
      
      // Clear input on success
      tripIdElement.value = '';
      
      return { success: true, message: `Successfully joined trip #${tripId}` };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to join trip'
      };
    }
  }
}