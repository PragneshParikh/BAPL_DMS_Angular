import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewsBulletin } from './add-news-bulletin';

describe('AddNewsBulletin', () => {
  let component: AddNewsBulletin;
  let fixture: ComponentFixture<AddNewsBulletin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewsBulletin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewsBulletin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
