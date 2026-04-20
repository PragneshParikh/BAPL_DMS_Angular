import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSeed } from './data-seed';

describe('DataSeed', () => {
  let component: DataSeed;
  let fixture: ComponentFixture<DataSeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataSeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
