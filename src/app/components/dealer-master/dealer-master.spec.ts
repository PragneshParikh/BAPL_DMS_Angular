import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerMaster } from './dealer-master';

describe('DealerMaster', () => {
  let component: DealerMaster;
  let fixture: ComponentFixture<DealerMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
