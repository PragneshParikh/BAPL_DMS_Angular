import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartInwardList } from './part-inward-list';

describe('PartInwardList', () => {
  let component: PartInwardList;
  let fixture: ComponentFixture<PartInwardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartInwardList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartInwardList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
