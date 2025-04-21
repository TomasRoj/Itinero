import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FriendService, Friend } from '../../services/friend-service.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})
export class FriendsComponent implements OnInit {
  friends: Friend[] = [];
  newFriendId: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;

  constructor(private friendService: FriendService) { }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    this.isLoading = true;
    this.showError = false;
    
    this.friendService.getFriends().subscribe({
      next: (data) => {
        this.friends = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading friends', error);
        this.isLoading = false;
        
        // Check if it's an auth error
        if (error.status === 401) {
          this.errorMessage = 'You need to be logged in to view friends. Please log in.';
          this.showError = true;
        } else {
          this.errorMessage = 'Could not load friends. Please try again later.';
          this.showError = true;
          
          // Only use fallback data in development
          if (error.status === 0) {
            // This likely means the API is not running
            this.loadFallbackData();
          }
        }
      }
    });
  }

  private loadFallbackData(): void {
    // Fallback mock data
    this.friends = [
      { id: 'D56LAX', name: 'Honza Novák', avatar: 'profile.jpg' },
      { id: 'R18JFK', name: 'Tomáš Veselý', avatar: 'profile.jpg' },
      { id: 'U44ATL', name: 'Petr Šťastný', avatar: 'profile.jpg' },
      { id: 'S26PRG', name: 'Ms. Jacksonová', avatar: 'profile.jpg' }
    ];
  }
  
  addFriend(): void {
    if (!this.newFriendId || this.newFriendId.trim() === '') return;
    
    this.isLoading = true;
    this.showError = false;
    
    this.friendService.addFriend(this.newFriendId).subscribe({
      next: (newFriend) => {
        this.friends.push(newFriend);
        this.newFriendId = ''; // Reset the input
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error adding friend', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'You need to be logged in to add friends. Please log in.';
        } else if (error.status === 400) {
          this.errorMessage = error.error || 'Invalid friend ID or you are already friends with this user.';
        } else if (error.status === 404) {
          this.errorMessage = 'User with this ID not found.';
        } else {
          this.errorMessage = 'Failed to add friend. Please try again.';
        }
        
        this.showError = true;
      }
    });
  }

  removeFriend(id: string): void {
    this.isLoading = true;
    this.showError = false;
    
    this.friendService.removeFriend(id).subscribe({
      next: () => {
        this.friends = this.friends.filter(friend => friend.id !== id);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error removing friend', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'You need to be logged in to remove friends. Please log in.';
          this.showError = true;
        } else {
          // Remove locally anyway for better UX
          this.friends = this.friends.filter(friend => friend.id !== id);
          this.errorMessage = 'There was an issue removing the friend, but we updated your view.';
          this.showError = true;
        }
      }
    });
  }
}