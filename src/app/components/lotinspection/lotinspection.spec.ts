import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lotinspection } from './lotinspection';

describe('Lotinspection', () => {
  let component: Lotinspection;
  let fixture: ComponentFixture<Lotinspection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lotinspection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lotinspection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
