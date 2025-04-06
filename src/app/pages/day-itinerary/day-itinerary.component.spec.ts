import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayItineraryComponent } from './day-itinerary.component';

describe('DayItineraryComponent', () => {
  let component: DayItineraryComponent;
  let fixture: ComponentFixture<DayItineraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayItineraryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayItineraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
