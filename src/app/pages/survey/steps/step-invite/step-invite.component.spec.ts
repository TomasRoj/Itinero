import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepInviteComponent } from './step-invite.component';

describe('StepInviteComponent', () => {
  let component: StepInviteComponent;
  let fixture: ComponentFixture<StepInviteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepInviteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
