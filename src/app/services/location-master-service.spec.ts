import { TestBed } from '@angular/core/testing';

import { LocationMasterService } from './location-master-service';

describe('LocationMasterService', () => {
  let service: LocationMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
