import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMasterComponent } from './employee-master';

describe('EmployeeMasterComponent', () => {
  let component: EmployeeMasterComponent;
  let fixture: ComponentFixture<EmployeeMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [  EmployeeMasterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent( EmployeeMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
