import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AttractionService, Attraction } from '../../services/attraction-service.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-attraction-info',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, HttpClientModule],
  providers: [AttractionService],
  templateUrl: './attraction-info.component.html',
  styleUrl: './attraction-info.component.scss'
})
export class AttractionInfoComponent implements OnInit {
  attraction: any = {
    image: 'kasna.jpg',
    backgroundImage: 'survey-bg.png',
    name: 'Loading...',
    country: '',
    address: '',
    opening_hours: '',
    entrance_fee: null,
    website: '',
    estimated_visit_time: null,
    description: ''
  };
  
  loading: boolean = true;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attractionService: AttractionService
  ) {}

  ngOnInit(): void {
    // Check if we're on the correct route and extract the ID
    this.route.params.subscribe(params => {
      console.log('Route params:', params); // Debug log
      const id = params['id'];
      
      if (id && !isNaN(Number(id))) {
        // Valid numeric ID
        this.loadAttraction(Number(id));
      } else {
        console.error('Invalid ID parameter:', id);
        this.error = true;
        this.loading = false;
        // Optionally redirect to the attractions list
        // this.router.navigate(['/attractions']);
      }
    });
  }

  loadAttraction(id: number): void {
    console.log('Loading attraction with ID:', id); // Debug log
    
    this.attractionService.getAttractionById(id).subscribe({
      next: (data) => {
        console.log('Attraction data received:', data); // Debug log
        this.attraction = {
          ...data,
          image: data.photo_url || 'kasna.jpg',
          backgroundImage: 'survey-bg.png'
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading attraction:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}