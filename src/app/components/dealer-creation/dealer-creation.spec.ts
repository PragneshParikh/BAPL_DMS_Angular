import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerCreation } from './dealer-creation';

describe('DealerCreation', () => {
  let component: DealerCreation;
  let fixture: ComponentFixture<DealerCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerCreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
