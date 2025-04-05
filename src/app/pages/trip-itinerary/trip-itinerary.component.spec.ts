import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripItineraryComponent } from './trip-itinerary.component';

describe('TripItineraryComponent', () => {
  let component: TripItineraryComponent;
  let fixture: ComponentFixture<TripItineraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripItineraryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripItineraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
