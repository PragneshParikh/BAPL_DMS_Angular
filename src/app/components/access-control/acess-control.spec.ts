import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessControl } from './access-control';

describe('RolePolicy', () => {
  let component: AccessControl;
  let fixture: ComponentFixture<AccessControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessControl]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AccessControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
