import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Form22master } from './form22master';

describe('Form22master', () => {
  let component: Form22master;
  let fixture: ComponentFixture<Form22master>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Form22master]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Form22master);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
