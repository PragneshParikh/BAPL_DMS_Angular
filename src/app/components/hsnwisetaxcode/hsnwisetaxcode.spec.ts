import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hsnwisetaxcode } from './hsnwisetaxcode';

describe('Hsnwisetaxcode', () => {
  let component: Hsnwisetaxcode;
  let fixture: ComponentFixture<Hsnwisetaxcode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hsnwisetaxcode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hsnwisetaxcode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
