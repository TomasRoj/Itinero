import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-friends',
  imports: [CommonModule, SidebarComponent, RouterModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})
export class FriendsComponent {
  members = [
    { 
      name: 'Kája Horáková', 
      role: 'Vlastník', 
      image: 'assets/images/profile1.jpg' 
    },
    { 
      name: 'Honza Novák', 
      role: 'Member', 
      image: 'assets/images/profile2.jpg' 
    },
    { 
      name: 'Tomáš Veselý', 
      role: 'Member', 
      image: 'assets/images/profile3.jpg' 
    }
  ]
}
