import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-dates',
  imports: [CommonModule,FormsModule],
  templateUrl: './step-dates.component.html',
  styleUrl: './step-dates.component.scss'
})
export class StepDatesComponent {
  @Output() dataChange = new EventEmitter<{startDate: string, endDate: string}>();

  startDate: string = '';
  endDate: string = '';

  onDateChange() {
    this.dataChange.emit({ startDate: this.startDate, endDate: this.endDate });
  }

}
