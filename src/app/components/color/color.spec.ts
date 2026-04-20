import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Color } from './color';

describe('Color', () => {
  let component: Color;
  let fixture: ComponentFixture<Color>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Color]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Color);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
