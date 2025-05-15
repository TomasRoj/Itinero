import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DestinationServiceService, Destination } from '../../../../services/destination-service.service';

@Component({
  selector: 'app-step-destination',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="survey-form rounded p-5 position-relative" style="z-index: 10;">
      <div class="row justify-content-center">
        <div class="col-lg-12 text-center">
          <h2 class="mb-2 fw-bold">Kam chcete vyrazit?</h2>
          <p class="text-muted mb-4">Co chcete navštívit? Zadejte název státu nebo památky/atrakce.</p>

          <div class="form-group mb-5">
            <div class="position-relative">
              <input 
                [(ngModel)]="destination" 
                type="text" 
                (ngModelChange)="onInputChange()"
                (keydown)="onKeyDown($event)"
                (focus)="showDropdown = true"
                (blur)="onBlur()"
                id="survey-destination-input" 
                class="form-control form-control-lg border-danger border-2 rounded-pill py-3 px-4"
                placeholder="Začněte psát, potvrďte klávesou enter..." 
                style="border-width: 3px !important;">
                
              <!-- Autocomplete Dropdown -->
              <div *ngIf="filteredDestinations.length > 0 && showDropdown" class="autocomplete-dropdown">
                <div 
                  *ngFor="let dest of filteredDestinations; let i = index" 
                  class="dropdown-item" 
                  [class.active]="i === activeIndex"
                  (mousedown)="selectDestination(dest)"
                  (mouseover)="activeIndex = i">
                  {{ dest.name }}
                  <span *ngIf="dest.country" class="text-muted"> ({{ dest.country }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .autocomplete-dropdown {
      position: absolute;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid #ced4da;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      top: calc(100% + 5px);
    }
    .dropdown-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      text-align: left;
    }
    .dropdown-item:hover, .dropdown-item.active {
      background-color: #f8f9fa;
    }
  `]
})
export class StepDestinationComponent implements OnInit {
  @Output() dataChange = new EventEmitter<{destination: string}>();

  destination = '';
  destinations: Destination[] = [];
  filteredDestinations: Destination[] = [];
  showDropdown = false;
  activeIndex = -1;

  constructor(private destinationService: DestinationServiceService) {}

  ngOnInit() {
    this.loadDestinations();
  }

  loadDestinations() {
    this.destinationService.getDestinations().subscribe({
      next: (data) => {
        this.destinations = data;
      },
      error: (error) => {
        console.error('Error loading destinations:', error);
      }
    });
  }

  onInputChange() {
    this.filterDestinations();
    this.dataChange.emit({ destination: this.destination });
    this.showDropdown = true;
    this.activeIndex = -1;
  }

  filterDestinations() {
    const query = this.destination.toLowerCase().trim();
    
    if (!query) {
      this.filteredDestinations = [];
      return;
    }
    
    this.filteredDestinations = this.destinations.filter(dest => 
      dest.name.toLowerCase().startsWith(query) || 
      (dest.country && dest.country.toLowerCase().startsWith(query))
    );
    
    // Sort results: names starting with the query first, then countries
    this.filteredDestinations.sort((a, b) => {
      const aNameStarts = a.name.toLowerCase().startsWith(query);
      const bNameStarts = b.name.toLowerCase().startsWith(query);
      
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  selectDestination(dest: Destination) {
    this.destination = dest.name;
    this.showDropdown = false;
    this.dataChange.emit({ destination: this.destination });
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.filteredDestinations.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeIndex = Math.min(this.activeIndex + 1, this.filteredDestinations.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeIndex = Math.max(this.activeIndex - 1, 0);
          break;
        case 'Enter':
          if (this.activeIndex >= 0) {
            event.preventDefault();
            this.selectDestination(this.filteredDestinations[this.activeIndex]);
          }
          break;
        case 'Escape':
          this.showDropdown = false;
          break;
      }
    }
  }

  onBlur() {
    // Small delay to allow click events on dropdown items to register before hiding
    setTimeout(() => {
      this.showDropdown = false;
    }, 150);
  }
}