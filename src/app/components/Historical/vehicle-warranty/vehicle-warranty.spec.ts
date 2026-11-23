import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleWarrantyComponent } from './vehicle-warranty';

describe('VehicleWarrantyComponent', () => {
  let component: VehicleWarrantyComponent;
  let fixture: ComponentFixture<VehicleWarrantyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleWarrantyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleWarrantyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});