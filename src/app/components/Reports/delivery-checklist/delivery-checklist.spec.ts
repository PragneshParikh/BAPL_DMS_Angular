import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryChecklist } from './delivery-checklist';

describe('DeliveryChecklist', () => {
  let component: DeliveryChecklist;
  let fixture: ComponentFixture<DeliveryChecklist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryChecklist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryChecklist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
