import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BgRoleMaster } from './bg-role-master';

describe('BgRoleMaster', () => {
  let component: BgRoleMaster;
  let fixture: ComponentFixture<BgRoleMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BgRoleMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BgRoleMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
