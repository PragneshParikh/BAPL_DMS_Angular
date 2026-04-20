import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HsnCodeMaster } from './hsn-code-master';

describe('HsnCodeMaster', () => {
  let component: HsnCodeMaster;
  let fixture: ComponentFixture<HsnCodeMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HsnCodeMaster]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HsnCodeMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
