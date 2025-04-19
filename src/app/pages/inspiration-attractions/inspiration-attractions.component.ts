import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AttractionService, Attraction } from '../../services/attraction-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inspiration-attractions',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterLink],
  providers: [AttractionService],
  templateUrl: './inspiration-attractions.component.html',
  styleUrl: './inspiration-attractions.component.scss'
})
export class InspirationAttractionsComponent implements OnInit {
  Attractions: Attraction[] = [];
  isLoading: boolean = true;
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
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nastala chyba při načítání atrakcí: ' + error.message;
        this.isLoading = false;
        console.error('Chyba při načítání atrakcí:', error);
      }
    });
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