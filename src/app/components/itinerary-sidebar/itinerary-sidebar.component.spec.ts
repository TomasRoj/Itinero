import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItinerarySidebarComponent } from './itinerary-sidebar.component';

describe('ItinerarySidebarComponent', () => {
  let component: ItinerarySidebarComponent;
  let fixture: ComponentFixture<ItinerarySidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItinerarySidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItinerarySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
