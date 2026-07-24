import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BgRoleMasterList } from './bg-role-master-list';

describe('BgRoleMasterList', () => {
  let component: BgRoleMasterList;
  let fixture: ComponentFixture<BgRoleMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BgRoleMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BgRoleMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
