import { TestBed } from '@angular/core/testing';

import { Lotinspectionservice } from './lotinspectionservice';

describe('Lotinspectionservice', () => {
  let service: Lotinspectionservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Lotinspectionservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
