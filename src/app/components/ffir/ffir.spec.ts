import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FFIR } from './ffir';

describe('FFIR', () => {
  let component: FFIR;
  let fixture: ComponentFixture<FFIR>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FFIR]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FFIR);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
