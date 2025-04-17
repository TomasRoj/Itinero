import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-name',
  imports: [FormsModule],
  templateUrl: './step-name.component.html',
  styleUrl: './step-name.component.scss'
})
export class StepNameComponent {
  @Output() dataChange = new EventEmitter<{name: string}>();

  name = '';

  onInputChange() {
    this.dataChange.emit({ name: this.name });
  }
}
