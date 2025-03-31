import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionaireNavbarComponent } from './questionaire-navbar.component';

describe('QuestionaireNavbarComponent', () => {
  let component: QuestionaireNavbarComponent;
  let fixture: ComponentFixture<QuestionaireNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionaireNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionaireNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
