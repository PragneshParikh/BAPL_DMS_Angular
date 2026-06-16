import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OccupationMaster } from './occupation-master';

describe('OccupationMaster', () => {
  let component: OccupationMaster;
  let fixture: ComponentFixture<OccupationMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OccupationMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OccupationMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
