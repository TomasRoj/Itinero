import { Component } from '@angular/core';
import { ItinerarySidebarComponent } from '../../components/itinerary-sidebar/itinerary-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink} from '@angular/router';

@Component({
  selector: 'app-add-expense',
  imports: [ItinerarySidebarComponent, CommonModule, RouterLink],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss'
})

export class AddExpenseComponent {

  selectedategory: string = '';
  selectedPayer: string = '';
  amount: number = 0;
  selectedCurrency: string = 'CZK';
  description: string = '';
  isSettled: boolean = false;

  users = [
    { id: '1', name: 'Jan Novák', included: true, percentage: 25 },
    { id: '2', name: 'Petr Svoboda', included: true, percentage: 25 },
    { id: '3', name: 'Marie Dvořáková', included: true, percentage: 25 },
    { id: '4', name: 'Tomáš Černý', included: true, percentage: 25 }
  ];

  categories = [
    { id: '1', name: 'Jídlo' },
    { id: '2', name: 'Doprava' },
    { id: '3', name: 'Ubytování' },
    { id: '4', name: 'Zábava' },
    { id: '5', name: 'Ostatní' }
  ];
}
