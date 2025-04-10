import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink} from '@angular/router';


@Component({
  selector: 'app-inspiration-destinations',
  imports: [SidebarComponent, CommonModule, RouterLink],
  templateUrl: './inspiration-destinations.component.html',
  styleUrl: './inspiration-destinations.component.scss'
  
})
export class InspirationDestinationsComponent {
  Destinations = [
    {
      id: 1,
      destination: 'Valetta',
      country: 'Malta',
      image: 'valetta.jpg',
      timeRecommendation: 'Červenec - srpen'
    },
    {
      id: 2,
      destination: 'Ammán',
      country: 'Jordánsko',
      image: 'amman.jpg',
      timeRecommendation: 'Listopad - březen'
    },
    {
      id: 3,
      destination: 'Brno',
      country: 'Česká republika',
      image: 'brno.jpg',
      timeRecommendation: 'Ideálně nikdy'
    }
  ];
}
