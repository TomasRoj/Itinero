import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../../../services/shared.service';
import { TripMemberService } from '../../../../services/trip-member.service';
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-step-invite',
  templateUrl: './step-invite.component.html',
  styleUrl: './step-invite.component.scss',
  imports: [CommonModule, FormsModule]
})
export class StepInviteComponent {

  constructor(private sharedService: SharedService, private tripMemberService: TripMemberService) {
  }

  friendID: string = '';

  onFriendChange(): void {
    // Uložení do service
    this.sharedService.setFriendId(this.friendID);
    console.log('StepInvite: Friend ID updated to:', this.friendID);
  }
}