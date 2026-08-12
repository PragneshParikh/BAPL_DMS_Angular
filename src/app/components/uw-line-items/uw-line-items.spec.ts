import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UwLineItems } from './uw-line-items';

describe('UwLineItems', () => {
  let component: UwLineItems;
  let fixture: ComponentFixture<UwLineItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UwLineItems]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UwLineItems);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
