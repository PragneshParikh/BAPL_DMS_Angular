import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryCertificate } from './delivery-certificate';

describe('DeliveryCertificate', () => {
  let component: DeliveryCertificate;
  let fixture: ComponentFixture<DeliveryCertificate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryCertificate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryCertificate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
