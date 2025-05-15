import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FriendService, Friend } from '../../services/friend-service.service';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { UserService, User } from '../../services/user-service.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  
  surnameSearchTerm: string = '';
  showSurnameSuggestions: boolean = false;
  filteredFriends: Array<Friend & { userDetails?: User | undefined }> = [];
  uniqueSurnames: string[] = [];
  filteredSurnames: string[] = [];
  friendsWithUserDetails: Array<Friend & { userDetails?: User | undefined }> = [];

  constructor(
    private friendService: FriendService, 
    private userService: UserService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    this.isLoading = true;
    this.showError = false;
    
    this.friendService.getFriends().subscribe({
      next: (data) => {
        this.friends = data;
        this.loadUserDetailsForFriends(data);
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
            this.simulateFallbackUserDetails();
          }
        }
      }
    });
  }

  private loadUserDetailsForFriends(friends: Friend[]): void {
    const userDetailsObservables = friends.map(friend => {
      const userId = friend.userId || parseInt(friend.id, 10);
      
      if (isNaN(userId)) {
        return of(undefined);
      }
      
      return this.http.get<User>(`http://localhost:5253/api/Users/${userId}`).pipe(
        catchError(error => {
          console.error(`Error fetching user details for friend ${friend.id}`, error);
          return of(undefined);
        })
      );
    });
    
    forkJoin(userDetailsObservables).subscribe({
      next: (userResults) => {
        this.friendsWithUserDetails = this.friends.map((friend, index) => {
          return {
            ...friend,
            userDetails: userResults[index]
          };
        });
        
        this.filteredFriends = this.friendsWithUserDetails;
        this.extractUniqueSurnames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user details for friends', error);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = 'Could not load user details for friends.';
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

  private simulateFallbackUserDetails(): void {
    const mockSurnames = ['Novák', 'Veselý', 'Šťastný', 'Jacksonová'];
    
    this.friendsWithUserDetails = this.friends.map((friend, index) => {
      const nameParts = friend.name.split(' ');
      const firstName = nameParts[0];
      const surname = mockSurnames[index % mockSurnames.length];
      
      return {
        ...friend,
        userDetails: {
          id: parseInt(friend.id, 10) || index + 1,
          name: firstName,
          surname: surname,
          email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@example.com`,
          preferedcurrency: 'CZK'
        }
      };
    });
    
    this.filteredFriends = this.friendsWithUserDetails;
    this.extractUniqueSurnames();
  }
  
  extractUniqueSurnames(): void {
    const surnames = new Set<string>();
    
    this.friendsWithUserDetails.forEach(friend => {
      if (friend.userDetails && friend.userDetails.surname) {
        surnames.add(friend.userDetails.surname);
      }
    });
    
    this.uniqueSurnames = Array.from(surnames).sort();
  }

  onSurnameSearch(): void {
    this.showSurnameSuggestions = this.surnameSearchTerm.length > 0;
    
    if (this.surnameSearchTerm) {
      const term = this.surnameSearchTerm.toLowerCase();
      this.filteredSurnames = this.uniqueSurnames.filter(surname => 
        surname.toLowerCase().includes(term)
      );
      this.filterFriends();
    } else {
      this.filteredSurnames = [];
      this.filteredFriends = this.friendsWithUserDetails;
    }
  }

  selectSurname(surname: string): void {
    this.surnameSearchTerm = surname;
    this.showSurnameSuggestions = false;
    this.filterFriends();
  }

  filterFriends(): void {
    if (this.surnameSearchTerm) {
      this.filteredFriends = this.friendsWithUserDetails.filter(friend => {
        if (friend.userDetails && friend.userDetails.surname) {
          return friend.userDetails.surname.toLowerCase() === this.surnameSearchTerm.toLowerCase();
        }
        return false;
      });
    } else {
      this.filteredFriends = this.friendsWithUserDetails;
    }
  }

  clearSurnameSearch(): void {
    this.surnameSearchTerm = '';
    this.filteredFriends = this.friendsWithUserDetails;
    this.showSurnameSuggestions = false;
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
        
        const userId = newFriend.userId || parseInt(newFriend.id, 10);
        if (!isNaN(userId)) {
          this.http.get<User>(`http://localhost:5253/api/Users/${userId}`).subscribe({
            next: (userDetails) => {
              const friendWithDetails = {
                ...newFriend,
                userDetails: userDetails
              };
              this.friendsWithUserDetails.push(friendWithDetails);
              this.filteredFriends = this.friendsWithUserDetails;
              this.extractUniqueSurnames(); // Update surnames list
            },
            error: (error) => {
              console.error('Error fetching user details for new friend', error);
              this.friendsWithUserDetails.push({...newFriend});
              this.filteredFriends = this.friendsWithUserDetails;
            }
          });
        } else {
          this.friendsWithUserDetails.push({...newFriend});
          this.filteredFriends = this.friendsWithUserDetails;
        }
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
        this.friendsWithUserDetails = this.friendsWithUserDetails.filter(friend => friend.id !== id);
        this.filteredFriends = this.filteredFriends.filter(friend => friend.id !== id);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error removing friend', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'You need to be logged in to remove friends. Please log in.';
          this.showError = true;
        } else {
          this.friends = this.friends.filter(friend => friend.id !== id);
          this.friendsWithUserDetails = this.friendsWithUserDetails.filter(friend => friend.id !== id);
          this.filteredFriends = this.filteredFriends.filter(friend => friend.id !== id);
          this.errorMessage = 'There was an issue removing the friend, but we updated your view.';
          this.showError = true;
        }
      }
    });
  }
}