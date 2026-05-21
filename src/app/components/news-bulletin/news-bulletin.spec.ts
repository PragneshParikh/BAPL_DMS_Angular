import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsBulletin } from './news-bulletin';

describe('NewsBulletin', () => {
  let component: NewsBulletin;
  let fixture: ComponentFixture<NewsBulletin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsBulletin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsBulletin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
