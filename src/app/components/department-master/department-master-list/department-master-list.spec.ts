import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentMasterList } from './department-master-list';

describe('DepartmentMasterList', () => {
  let component: DepartmentMasterList;
  let fixture: ComponentFixture<DepartmentMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
