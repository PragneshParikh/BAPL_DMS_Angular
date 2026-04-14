import { TestBed } from '@angular/core/testing';

import { PartsPoService } from './parts-po-service';

describe('PartsPoService', () => {
  let service: PartsPoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartsPoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
