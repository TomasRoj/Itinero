import { Component } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripMembersService } from '../../trip-member.service';
import { UserService } from '../../services/user-service.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [QuestionaireNavbarComponent, CommonModule, RouterLink],
  templateUrl: './join-group.component.html',
  styleUrls: ['./join-group.component.scss'],
  providers: [TripMembersService, UserService] // <-- Fix: Provide services here
})
export class JoinGroupComponent {
  message: string = ''; // Success/failure message

  constructor(
    private tripMembersService: TripMembersService,
    private userService: UserService
  ) {}

  // Handle form submission
  async joinTrip() {
    // Get tripId from input element
    const inputElement = document.getElementById('tripId_input') as HTMLInputElement | null;
    
    if (!inputElement) {
      console.error('[JoinTrip] Input element with ID "tripId_input" not found');
      this.message = 'Trip ID input box not found.';
      return;
    }

    const tripId = inputElement.value;
    console.log('[JoinTrip] Attempting to join trip with ID:', tripId);

    const result = await this.joinTripInternal(tripId, 'participant');
    console.log('[JoinTrip] Result:', result);
    this.message = result.message;
  }

  private async joinTripInternal(tripId: string, role: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[joinTripInternal] Received tripId:', tripId, 'with role:', role);
      const trimmedTripId = tripId.trim();

      if (!trimmedTripId) {
        console.warn('[joinTripInternal] No Trip ID provided.');
        return { success: false, message: 'Please enter a Trip ID' };
      }

      const numericTripId = parseInt(trimmedTripId, 10);
      if (isNaN(numericTripId)) {
        console.warn('[joinTripInternal] Trip ID is not a valid number:', trimmedTripId);
        return { success: false, message: 'Please enter a valid Trip ID number' };
      }

      console.log('[joinTripInternal] Parsed Trip ID:', numericTripId);

      let currentUser;
      try {
        currentUser = await firstValueFrom(this.userService.getCurrentUser());
        console.log('[joinTripInternal] Current user retrieved:', currentUser);

        if (!currentUser || !currentUser.id) {
          console.error('[joinTripInternal] Invalid current user object:', currentUser);
          return { success: false, message: 'Could not retrieve user information' };
        }
      } catch (error) {
        console.error('[joinTripInternal] Error fetching current user:', error);
        return { success: false, message: 'You must be logged in to join a trip' };
      }

      console.log('[joinTripInternal] Adding user to trip:', numericTripId);

      await this.tripMembersService.addMemberToTrip(numericTripId, {
        user_id: currentUser.id,
        role: role
      });

      console.log('[joinTripInternal] Successfully added user to trip');

      return { success: true, message: `Successfully joined trip #${numericTripId}` };

    } catch (error) {
      console.error('[joinTripInternal] Unexpected error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to join trip'
      };
    }
  }
}