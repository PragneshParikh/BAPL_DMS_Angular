import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialTransferReport } from './material-transfer-report';

describe('MaterialTransferReport', () => {
  let component: MaterialTransferReport;
  let fixture: ComponentFixture<MaterialTransferReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialTransferReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialTransferReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
