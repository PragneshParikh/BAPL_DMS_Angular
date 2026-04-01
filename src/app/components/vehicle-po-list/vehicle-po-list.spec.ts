import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePoList } from './vehicle-po-list';

describe('VehiclePoList', () => {
  let component: VehiclePoList;
  let fixture: ComponentFixture<VehiclePoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclePoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiclePoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
