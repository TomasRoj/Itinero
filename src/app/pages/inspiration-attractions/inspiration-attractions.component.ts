import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inspiration-attractions',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './inspiration-attractions.component.html',
  styleUrl: './inspiration-attractions.component.scss'
})
export class InspirationAttractionsComponent {
  Attractions = [
    {
      id: 1,
      attraction_name: 'Petra',
      place: 'Petra, Jordánsko',
      image: 'petra.jpg',
      timeRecommendation: 'Červenec - srpen'
    },
    {
      id: 2,
      attraction_name: 'St. Elmo',
      place: 'Valetta, Malta',
      image: 'st-elmo.jpeg',
      timeRecommendation: 'Listopad - březen'
    },
    {
      id: 3,
      attraction_name: 'Kašna',
      place: 'Brno, Česká republika',
      image: 'kasna.jpg',
      timeRecommendation: 'Ideálně nikdy'
    }
  ];
}
