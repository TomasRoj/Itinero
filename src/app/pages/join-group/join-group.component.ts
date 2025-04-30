import { Component } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripMemberService } from '../../services/trip-member.service';
import { UserService } from '../../services/user-service.service';

@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [QuestionaireNavbarComponent, CommonModule, RouterLink],
  templateUrl: './join-group.component.html',
  styleUrls: ['./join-group.component.scss'],
  providers: [TripMemberService, UserService]
})
export class JoinGroupComponent {

  constructor(
    private tripMemberService: TripMemberService,
    private userService: UserService
  ) {}

  joinTrip(tripIdValue: string): void {
    const tripId = Number(tripIdValue);
    if (!tripId) {
      console.error('Neplatné ID výletu');
      return;
    }
  
    this.userService.getCurrentUser().subscribe(user => {
      const userId = user.id;
  
      this.tripMemberService.addTripMember(tripId, userId).subscribe(response => {
        console.log('Uživatel přidán do výletu:', response);
      });
    });
  }  
    
}