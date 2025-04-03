import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspirationDestinationsComponent } from './inspiration-destinations.component';

describe('InspirationDestinationsComponent', () => {
  let component: InspirationDestinationsComponent;
  let fixture: ComponentFixture<InspirationDestinationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspirationDestinationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspirationDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
