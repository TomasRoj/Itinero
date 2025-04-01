import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepDestinationComponent } from './step-destination.component';
import { QuestionaireNavbarComponent } from "../../../../components/questionaire-navbar/questionaire-navbar.component";

describe('StepDestinationComponent', () => {
  let component: StepDestinationComponent;
  let fixture: ComponentFixture<StepDestinationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDestinationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
