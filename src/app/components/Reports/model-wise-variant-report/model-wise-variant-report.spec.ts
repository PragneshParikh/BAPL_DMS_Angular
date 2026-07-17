import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelWiseVariantReport } from './model-wise-variant-report';

describe('ModelWiseVariantReport', () => {
  let component: ModelWiseVariantReport;
  let fixture: ComponentFixture<ModelWiseVariantReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelWiseVariantReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelWiseVariantReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
