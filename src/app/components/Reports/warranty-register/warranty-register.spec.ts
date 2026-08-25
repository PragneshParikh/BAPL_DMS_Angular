import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyRegister } from './warranty-register';

describe('WarrantyRegister', () => {
  let component: WarrantyRegister;
  let fixture: ComponentFixture<WarrantyRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
