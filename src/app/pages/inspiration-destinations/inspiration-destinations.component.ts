import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router} from '@angular/router';
import { DestinationServiceService, Destination } from '../../services/destination-service.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inspiration-destinations',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterLink, FormsModule],
  templateUrl: './inspiration-destinations.component.html',
  styleUrl: './inspiration-destinations.component.scss'
})
export class InspirationDestinationsComponent implements OnInit {
  isLoading: boolean = true;
  filteredDestinations: Destination[] = [];
  uniqueCountries: string[] = [];
  countrySearchTerm: string = '';
  showCountrySuggestions: boolean = false;
  filteredCountries: string[] = [];
  destinations: Destination[] = [];
  errorMessage: string = '';

  constructor(private destinationService: DestinationServiceService, private router: Router) { }

  ngOnInit(): void {
    this.loadDestinations();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = '/valetta.jpg';
  }

  loadDestinations(): void {
    this.isLoading = true;
    this.destinationService.getDestinations().subscribe({
      next: (data) => {
        this.destinations = data;
        this.filteredDestinations = data; // Initialize filteredDestinations
        this.extractUniqueCountries(); // Call extractUniqueCountries after data is loaded
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nastala chyba při načítání atrakcí: ' + error.message;
        this.isLoading = false;
        console.error('Chyba při načítání atrakcí:', error);
      }
    });
  }

  extractUniqueCountries(): void {
    const countries = new Set<string>();
    this.destinations.forEach(destination => {
      if (destination.country) {
        countries.add(destination.country);
      }
    });
    this.uniqueCountries = Array.from(countries).sort();
  }

  onCountrySearch(): void {
    this.showCountrySuggestions = this.countrySearchTerm.length > 0;
    
    if (this.countrySearchTerm) {
      const term = this.countrySearchTerm.toLowerCase();
      this.filteredCountries = this.uniqueCountries.filter(country => 
        country.toLowerCase().includes(term)
      );
      // Auto-filter destinations as user types
      this.filterDestinations();
    } else {
      this.filteredCountries = [];
      this.filteredDestinations = this.destinations;
    }
  }

  selectCountry(country: string): void {
    this.countrySearchTerm = country;
    this.showCountrySuggestions = false;
    this.filterDestinations();
  }

  filterDestinations(): void {
    if (this.countrySearchTerm) {
      this.filteredDestinations = this.destinations.filter(destination => 
        destination.country && destination.country.toLowerCase() === this.countrySearchTerm.toLowerCase()
      );
    } else {
      this.filteredDestinations = this.destinations;
    }
  }

  clearSearch(): void {
    this.countrySearchTerm = '';
    this.filteredDestinations = this.destinations;
    this.showCountrySuggestions = false;
  }
}