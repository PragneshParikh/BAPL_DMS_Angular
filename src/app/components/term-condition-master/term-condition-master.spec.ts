import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermConditionMaster } from './term-condition-master';

describe('TermConditionMaster', () => {
  let component: TermConditionMaster;
  let fixture: ComponentFixture<TermConditionMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermConditionMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermConditionMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
