import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalMaterialTransfer } from './historical-material-transfer';

describe('HistoricalMaterialTransfer', () => {
  let component: HistoricalMaterialTransfer;
  let fixture: ComponentFixture<HistoricalMaterialTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalMaterialTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalMaterialTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
