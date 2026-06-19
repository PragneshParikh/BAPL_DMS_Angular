import { TestBed } from '@angular/core/testing';

import { ServiceHeadService } from './service-head-service';

describe('ServiceHeadService', () => {
  let service: ServiceHeadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceHeadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
