import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoBilling } from './repo-billing';

describe('RepoBilling', () => {
  let component: RepoBilling;
  let fixture: ComponentFixture<RepoBilling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepoBilling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepoBilling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
