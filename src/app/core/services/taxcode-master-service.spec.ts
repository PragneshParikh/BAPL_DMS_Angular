import { TestBed } from '@angular/core/testing';

import { TaxCodeMasterService } from './taxcode-master-service';

describe('TaxcodeMasterService', () => {
  let service: TaxCodeMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxCodeMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
