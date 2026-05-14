import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ffirlisting } from './ffirlisting';

describe('Ffirlisting', () => {
  let component: Ffirlisting;
  let fixture: ComponentFixture<Ffirlisting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ffirlisting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ffirlisting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
