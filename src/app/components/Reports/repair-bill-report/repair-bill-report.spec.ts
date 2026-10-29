import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepairBillReportComponent } from './repair-bill-report';

describe('RepairBillReportComponent', () => {
  let component: RepairBillReportComponent;
  let fixture: ComponentFixture<RepairBillReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBillReportComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RepairBillReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});