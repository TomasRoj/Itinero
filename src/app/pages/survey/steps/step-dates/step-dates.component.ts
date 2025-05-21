import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../../../services/shared.service';

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
  rangeError: string = '';
  continueButtonDisabled: boolean = true;

  constructor(private sharedService: SharedService) {
    this.sharedService.continueButtonDisabled.subscribe(
      (disabled) => {
        this.continueButtonDisabled = disabled;
      }
    );
    this.sharedService.continueButtonDisabled.next(true);
  }

  ngOnInit() {
    this.checkIfPrevious();
    if (this.sharedService.formData.startDate) {
      this.startDate = this.sharedService.formData.startDate;
    }
    if (this.sharedService.formData.endDate) {
      this.endDate = this.sharedService.formData.endDate;
    }
  }

  onDateChange() {

    if (this.startDate > this.endDate) {
      this.rangeError = 'Výlet nemůže začít po jeho konci.'; 
    }

    else if (this.startDate == '' || this.endDate == '') {
      this.rangeError = 'Zadejte platná data.';
    }

    else if (this.startDate < new Date().toISOString().split('T')[0]) {
      this.rangeError = 'Výlet musí být v budoucnosti.';
    }

    else {
      this.rangeError = '';
      this.dataChange.emit({ startDate: this.startDate, endDate: this.endDate });
      this.sharedService.continueButtonDisabled.next(false);
      this.sharedService.formData.startDate = this.startDate;
      this.sharedService.formData.endDate = this.endDate;
    }

  }

  checkIfPrevious(){
    if (this.sharedService.formData.destination.trim() !== ''){
      this.rangeError = '';
      this.sharedService.continueButtonDisabled.next(false);
    }
  }

}
