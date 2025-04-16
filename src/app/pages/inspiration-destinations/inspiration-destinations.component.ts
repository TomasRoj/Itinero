import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, Router} from '@angular/router';
import { DestinationServiceService, Destination } from '../../services/destination-service.service';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-inspiration-destinations',
  imports: [SidebarComponent, CommonModule, RouterLink],
  templateUrl: './inspiration-destinations.component.html',
  styleUrl: './inspiration-destinations.component.scss'
  
})
export class InspirationDestinationsComponent {

  constructor(@Inject(DestinationServiceService) private destinationService: DestinationServiceService, private router: Router) { }

  Destinations: Destination[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  ngOnInit(): void {
    this.loadDestinations();
  }

  loadDestinations(): void {
    this.isLoading = true;
    this.destinationService.getDestinations().subscribe({
      next: (data) => {
        this.Destinations = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nastala chyba při načítání atrakcí: ' + error.message;
        this.isLoading = false;
        console.error('Chyba při načítání atrakcí:', error);
      }
    });
  }

  viewAttractionDetail(attractionId: number): void {
    this.router.navigate(['/attractioninfo', attractionId]);
  }
}
