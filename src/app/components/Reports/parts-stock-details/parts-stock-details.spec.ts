import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsStockDetails } from './parts-stock-details';

describe('PartsStockDetails', () => {
  let component: PartsStockDetails;
  let fixture: ComponentFixture<PartsStockDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsStockDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsStockDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
