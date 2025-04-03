import { Component } from '@angular/core';
import { QuestionaireNavbarComponent } from "../../components/questionaire-navbar/questionaire-navbar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-join-group',
  imports: [QuestionaireNavbarComponent, CommonModule],
  templateUrl: './join-group.component.html',
  styleUrl: './join-group.component.scss'
})
export class JoinGroupComponent {

}
