import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceTypeMaster } from './service-type-master';

describe('ServiceTypeMaster', () => {
  let component: ServiceTypeMaster;
  let fixture: ComponentFixture<ServiceTypeMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceTypeMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceTypeMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
