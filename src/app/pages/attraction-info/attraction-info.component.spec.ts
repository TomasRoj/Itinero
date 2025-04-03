import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttractionInfoComponent } from './attraction-info.component';

describe('AttractionInfoComponent', () => {
  let component: AttractionInfoComponent;
  let fixture: ComponentFixture<AttractionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttractionInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttractionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
