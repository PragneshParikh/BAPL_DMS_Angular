import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentMaster } from './department-master';

describe('DepartmentMaster', () => {
  let component: DepartmentMaster;
  let fixture: ComponentFixture<DepartmentMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
