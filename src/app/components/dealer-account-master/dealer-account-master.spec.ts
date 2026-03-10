import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerAccountMaster } from './dealer-account-master';

describe('DealerAccountMaster', () => {
  let component: DealerAccountMaster;
  let fixture: ComponentFixture<DealerAccountMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerAccountMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerAccountMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
