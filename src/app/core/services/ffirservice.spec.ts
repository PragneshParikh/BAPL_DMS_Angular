import { TestBed } from '@angular/core/testing';

import { FFIRService } from './ffirservice';

describe('FFIRService', () => {
  let service: FFIRService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FFIRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
