import { TestBed } from '@angular/core/testing';

import { OemmodelMasterService } from './oemmodel-master-service';

describe('OemmodelMasterService', () => {
  let service: OemmodelMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OemmodelMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
