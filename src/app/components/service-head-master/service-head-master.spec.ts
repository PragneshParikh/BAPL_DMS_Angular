import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceHeadMaster } from './service-head-master';

describe('ServiceHeadMaster', () => {
  let component: ServiceHeadMaster;
  let fixture: ComponentFixture<ServiceHeadMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceHeadMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceHeadMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
