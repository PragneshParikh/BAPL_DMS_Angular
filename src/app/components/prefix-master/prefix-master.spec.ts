import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrefixMaster } from './prefix-master';

describe('PrefixMaster', () => {
  let component: PrefixMaster;
  let fixture: ComponentFixture<PrefixMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrefixMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrefixMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
