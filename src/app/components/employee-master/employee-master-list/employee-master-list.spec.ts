import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMasterList } from './employee-master-list';

describe('EmployeeMasterList', () => {
  let component: EmployeeMasterList;
  let fixture: ComponentFixture<EmployeeMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
