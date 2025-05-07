import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AttractionService, Attraction } from '../../services/attraction-service.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inspiration-attractions',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterLink, FormsModule],
  providers: [AttractionService],
  templateUrl: './inspiration-attractions.component.html',
  styleUrl: './inspiration-attractions.component.scss'
})
export class InspirationAttractionsComponent implements OnInit {
  Attractions: Attraction[] = [];
  isLoading: boolean = true;
  filteredAttractions: Attraction[] = [];
  uniqueCountries: string[] = [];
  countrySearchTerm: string = '';
  showCountrySuggestions: boolean = false;
  filteredCountries: string[] = [];
  errorMessage: string = '';  
  constructor(private attractionService: AttractionService, private router: Router) { }

  ngOnInit(): void {
    this.loadAttractions();
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = '/kasna.jpg';
  }


  loadAttractions(): void {
    this.isLoading = true;
    this.attractionService.getAttractions().subscribe({
      next: (data) => {
        this.Attractions = data;
        this.filteredAttractions = data;
        this.extractUniqueCountries();
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
    this.Attractions.forEach(attraction => {
      if (attraction.country) {
        countries.add(attraction.country);
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
    } else {
      this.filteredCountries = [];
      this.filteredAttractions = this.Attractions;
    }
  }
  selectCountry(country: string): void {
    this.countrySearchTerm = country;
    this.showCountrySuggestions = false;
    this.filterAttractions();
  }

  filterAttractions(): void {
    if (this.countrySearchTerm) {
      this.filteredAttractions = this.Attractions.filter(attraction => 
        attraction.country && attraction.country.toLowerCase() === this.countrySearchTerm.toLowerCase()
      );
    } else {
      this.filteredAttractions = this.Attractions;
    }
  }

  clearSearch(): void {
    this.countrySearchTerm = '';
    this.filteredAttractions = this.Attractions;
    this.showCountrySuggestions = false;
  }
  viewAttractionDetail(attractionId: number | null): void {
    console.log('Navigating to attraction with ID:', attractionId); // Debug log
    if (attractionId !== null && !isNaN(attractionId)) {
      this.router.navigate(['/attractioninfo', attractionId]);
    } else {
      console.error('Invalid attraction ID:', attractionId);
    }
  }  
}