import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignationMasterList } from './designation-master-list';

describe('DesignationMasterList', () => {
  let component: DesignationMasterList;
  let fixture: ComponentFixture<DesignationMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignationMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignationMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
