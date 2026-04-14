import { TestBed } from '@angular/core/testing';

import { PartsPoListService } from './parts-po-list-service';

describe('PartsPoListService', () => {
  let service: PartsPoListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartsPoListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
