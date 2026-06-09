import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplaintMaster } from './complaint-master';

describe('ComplaintMaster', () => {
  let component: ComplaintMaster;
  let fixture: ComponentFixture<ComplaintMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplaintMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplaintMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
