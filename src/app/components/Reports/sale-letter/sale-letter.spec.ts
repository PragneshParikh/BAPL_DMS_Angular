import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleLetter } from './sale-letter';

describe('SaleLetter', () => {
  let component: SaleLetter;
  let fixture: ComponentFixture<SaleLetter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleLetter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleLetter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
