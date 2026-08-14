import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyPackaging } from './warranty-packaging';

describe('WarrantyPackaging', () => {
  let component: WarrantyPackaging;
  let fixture: ComponentFixture<WarrantyPackaging>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyPackaging]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyPackaging);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
