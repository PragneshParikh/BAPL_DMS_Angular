import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularPermission } from './circular-permission';

describe('CircularPermission', () => {
  let component: CircularPermission;
  let fixture: ComponentFixture<CircularPermission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularPermission]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularPermission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
