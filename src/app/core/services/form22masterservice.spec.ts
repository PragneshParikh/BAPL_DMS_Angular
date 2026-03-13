import { TestBed } from '@angular/core/testing';

import { Form22masterservice } from './form22masterservice';

describe('Form22masterservice', () => {
  let service: Form22masterservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Form22masterservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
