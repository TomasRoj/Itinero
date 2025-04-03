import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspirationAttractionsComponent } from './inspiration-attractions.component';

describe('InspirationAttractionsComponent', () => {
  let component: InspirationAttractionsComponent;
  let fixture: ComponentFixture<InspirationAttractionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspirationAttractionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspirationAttractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
