import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaysTabComponent } from './days-tab.component';

describe('DaysTabComponent', () => {
  let component: DaysTabComponent;
  let fixture: ComponentFixture<DaysTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaysTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaysTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
