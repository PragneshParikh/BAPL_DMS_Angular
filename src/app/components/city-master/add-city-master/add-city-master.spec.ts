import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCityMaster } from './add-city-master';

describe('AddCityMaster', () => {
  let component: AddCityMaster;
  let fixture: ComponentFixture<AddCityMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCityMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCityMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
