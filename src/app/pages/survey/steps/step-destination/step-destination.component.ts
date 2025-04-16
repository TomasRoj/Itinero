import { Component, EventEmitter, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-destination',
  imports: [FormsModule],
  templateUrl: './step-destination.component.html',
  styleUrl: './step-destination.component.scss'
})
export class StepDestinationComponent {
  @Output() dataChange = new EventEmitter<{name: string}>();

  destination = '';

  onInputChange() {
    this.dataChange.emit({ name: this.destination });
  }

}
