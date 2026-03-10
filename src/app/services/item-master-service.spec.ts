import { TestBed } from '@angular/core/testing';

import { ItemMasterService } from './item-master-service';

describe('ItemMasterService', () => {
  let service: ItemMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
