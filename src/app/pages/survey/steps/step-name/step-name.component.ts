import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../../services/shared.service';

@Component({
  selector: 'app-step-name',
  imports: [FormsModule, CommonModule],
  templateUrl: './step-name.component.html',
  styleUrl: './step-name.component.scss'
})
export class StepNameComponent {
  @Output() dataChange = new EventEmitter<{name: string}>();

  constructor(private sharedService: SharedService) {
    this.sharedService.continueButtonDisabled.subscribe(
      (disabled) => {
        this.continueButtonDisabled = disabled;
      }
    );
  }

  name = '';
  nullError: string = 'Zadejte platný název výletu.';
  continueButtonDisabled: boolean = true;

  ngOnInit() {
    this.checkIfPrevious();
    if (this.sharedService.formData.name) {
      this.name = this.sharedService.formData.name;
    }
  }

  onInputChange() {

    if (this.name.trim() === '') {
      this.nullError = 'Zadejte platný název výletu.';
    } else {
      this.nullError = '';
      this.sharedService.continueButtonDisabled.next(false);
      this.sharedService.formData.name = this.name;
      this.dataChange.emit({ name: this.name });
    }
  }

  checkIfPrevious(){
    if (this.sharedService.formData.name.trim() !== ''){
      this.nullError = '';
      this.sharedService.continueButtonDisabled.next(false);
    }
  }
}
