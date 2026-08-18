import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispatchMaster } from './dispatch-master';

describe('DispatchMaster', () => {
  let component: DispatchMaster;
  let fixture: ComponentFixture<DispatchMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispatchMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DispatchMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
