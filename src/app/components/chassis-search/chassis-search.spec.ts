import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChassisSearch } from './chassis-search';

describe('ChassisSearch', () => {
  let component: ChassisSearch;
  let fixture: ComponentFixture<ChassisSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChassisSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChassisSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
