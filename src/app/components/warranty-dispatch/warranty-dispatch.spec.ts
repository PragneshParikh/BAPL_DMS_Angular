import { TestBed } from '@angular/core/testing';

import { WarrantyDispatch } from './warranty-dispatch';

describe('WarrantyDispatch', () => {
  let service: WarrantyDispatch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarrantyDispatch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
