import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOemmodelWarranty } from './add-oemmodel-warranty';

describe('AddOemmodelWarranty', () => {
  let component: AddOemmodelWarranty;
  let fixture: ComponentFixture<AddOemmodelWarranty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOemmodelWarranty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddOemmodelWarranty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
