import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimateList } from './estimate-list';

describe('EstimateList', () => {
  let component: EstimateList;
  let fixture: ComponentFixture<EstimateList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimateList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstimateList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
