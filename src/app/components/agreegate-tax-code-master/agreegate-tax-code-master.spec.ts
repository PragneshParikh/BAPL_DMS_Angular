import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreegateTaxCodeMaster } from './agreegate-tax-code-master';

describe('AgreegateTaxCodeMaster', () => {
  let component: AgreegateTaxCodeMaster;
  let fixture: ComponentFixture<AgreegateTaxCodeMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgreegateTaxCodeMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgreegateTaxCodeMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
