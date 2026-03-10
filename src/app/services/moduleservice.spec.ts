import { TestBed } from '@angular/core/testing';

import { Moduleservice } from './moduleservice';

describe('Moduleservice', () => {
  let service: Moduleservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Moduleservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
