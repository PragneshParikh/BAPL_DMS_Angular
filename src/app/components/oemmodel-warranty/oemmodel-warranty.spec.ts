import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OemmodelWarranty } from './oemmodel-warranty';

describe('OemmodelWarranty', () => {
  let component: OemmodelWarranty;
  let fixture: ComponentFixture<OemmodelWarranty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OemmodelWarranty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OemmodelWarranty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
