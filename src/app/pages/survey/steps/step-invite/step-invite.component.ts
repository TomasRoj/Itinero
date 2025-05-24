import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../../../services/shared.service';
import { TripMemberService } from '../../../../services/trip-member.service';

@Component({
  selector: 'app-step-invite',
  templateUrl: './step-invite.component.html',
  styleUrl: './step-invite.component.scss',
  imports: [CommonModule, FormsModule]
})
export class StepInviteComponent {
  friendID: number = 0;

  constructor(private sharedService: SharedService, private tripMemberService: TripMemberService) {
  }

  addFriend() {
    if (this.friendID) {
      this.tripMemberService.addTripMember(this.sharedService.tripId.value, this.friendID, "Member").subscribe({
        next: () => {
          console.log('Friend added successfully');
          this.friendID = 0;
        },
        error: (error) => {
          console.error('Error adding friend:', error);
        }
      });
    }
  }
}