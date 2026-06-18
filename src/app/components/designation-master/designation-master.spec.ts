import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignationMaster } from './designation-master';

describe('DesignationMaster', () => {
  let component: DesignationMaster;
  let fixture: ComponentFixture<DesignationMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignationMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignationMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
