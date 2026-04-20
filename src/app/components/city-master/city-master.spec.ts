import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityMaster } from './city-master';

describe('CityMaster', () => {
  let component: CityMaster;
  let fixture: ComponentFixture<CityMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CityMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
