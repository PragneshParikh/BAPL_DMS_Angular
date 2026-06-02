import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Circular } from './circular';

describe('Circular', () => {
  let component: Circular;
  let fixture: ComponentFixture<Circular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Circular]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Circular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
