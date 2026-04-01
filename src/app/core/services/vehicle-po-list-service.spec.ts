import { TestBed } from '@angular/core/testing';

import { VehiclePoListService } from './vehicle-po-list-service';

describe('VehiclePoListService', () => {
  let service: VehiclePoListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehiclePoListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
