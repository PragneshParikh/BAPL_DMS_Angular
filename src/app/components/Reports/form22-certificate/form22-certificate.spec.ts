import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Form22Certificate } from './form22-certificate';

describe('Form22Certificate', () => {
  let component: Form22Certificate;
  let fixture: ComponentFixture<Form22Certificate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Form22Certificate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Form22Certificate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
