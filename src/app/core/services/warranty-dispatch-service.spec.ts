import { TestBed } from '@angular/core/testing';

import { WarrantyDispatchService } from './warranty-dispatch-service';

describe('WarrantyDispatchService', () => {
  let service: WarrantyDispatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarrantyDispatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
