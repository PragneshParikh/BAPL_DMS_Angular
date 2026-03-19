import { TestBed } from '@angular/core/testing';

import { AgreegateTaxCodeMasterservice } from './agreegate-tax-code-masterservice';

describe('AgreegateTaxCodeMasterservice', () => {
  let service: AgreegateTaxCodeMasterservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgreegateTaxCodeMasterservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
