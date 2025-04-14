import {Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';


interface Friend {
  id: string;
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-friends',
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})

export class FriendsComponent implements OnInit {
  friends: Friend[] = [];
  newFriendId: string = '';

  constructor() { }

  ngOnInit(): void {
    // Initialize with example friends data (similar to the screenshot)
    this.friends = [
      { 
        id: 'D56LAX', 
        name: 'Honza Novák', 
        avatar: 'assets/avatars/avatar1.png' 
      },
      { 
        id: 'R18JFK', 
        name: 'Tomáš Veselý', 
        avatar: 'assets/avatars/avatar2.png' 
      },
      { 
        id: 'U44ATL', 
        name: 'Petr Šťastný', 
        avatar: 'assets/avatars/avatar3.png' 
      },
      { 
        id: 'S26PRG', 
        name: 'Ms. Jacksonová', 
        avatar: 'assets/avatars/avatar4.png' 
      }
    ];
  }
  
  addFriend(): void {
    if (!this.newFriendId) return;
    
    // In a real app, you would make an API call to validate the ID and get user info
    // For this example, we'll add a placeholder friend
    const newFriend: Friend = {
      id: this.newFriendId,
      name: 'Nový Přítel', // This would come from your API in a real app
      avatar: 'assets/avatars/default.png'
    };

    this.friends.push(newFriend);
    this.newFriendId = ''; // Reset the input
  }

  removeFriend(id: string): void {
    // Remove the friend with the matching ID
    this.friends = this.friends.filter(friend => friend.id !== id);
  }
}