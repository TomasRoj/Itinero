import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attraction-info',
  imports: [CommonModule, SidebarComponent],
  templateUrl: './attraction-info.component.html',
  styleUrl: './attraction-info.component.scss'
})
export class AttractionInfoComponent {

}
