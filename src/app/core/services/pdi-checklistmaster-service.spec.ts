import { TestBed } from '@angular/core/testing';

import { PdiChecklistmasterService } from './pdi-checklistmaster-service';

describe('PdiChecklistmasterService', () => {
  let service: PdiChecklistmasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdiChecklistmasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
