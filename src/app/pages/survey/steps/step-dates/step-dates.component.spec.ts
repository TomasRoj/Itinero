import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepDatesComponent } from './step-dates.component';

describe('StepDatesComponent', () => {
  let component: StepDatesComponent;
  let fixture: ComponentFixture<StepDatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepDatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
