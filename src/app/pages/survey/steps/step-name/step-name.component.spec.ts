import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepNameComponent } from './step-name.component';

describe('StepNameComponent', () => {
  let component: StepNameComponent;
  let fixture: ComponentFixture<StepNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
