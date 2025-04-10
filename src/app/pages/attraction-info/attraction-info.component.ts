import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkWithHref} from '@angular/router';

@Component({
  selector: 'app-attraction-info',
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './attraction-info.component.html',
  styleUrl: './attraction-info.component.scss'
})
export class AttractionInfoComponent {
  attraction = {
    image: 'kasna.jpg',
    backgroundImage: 'survey-bg.png',
    name: 'Kašna Parnas',
  };
}
