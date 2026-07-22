import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartInward } from './part-inward';

describe('PartInward', () => {
  let component: PartInward;
  let fixture: ComponentFixture<PartInward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartInward]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartInward);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
