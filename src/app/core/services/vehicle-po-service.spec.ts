import { TestBed } from '@angular/core/testing';

import { VehiclePoService } from './vehicle-po-service';

describe('VehiclePoService', () => {
  let service: VehiclePoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehiclePoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
