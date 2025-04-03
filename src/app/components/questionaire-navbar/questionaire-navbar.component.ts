import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-questionaire-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './questionaire-navbar.component.html',
  styleUrl: './questionaire-navbar.component.scss'
})
export class QuestionaireNavbarComponent {

}
