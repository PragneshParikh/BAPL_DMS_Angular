import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCircular } from './add-circular';

describe('AddCircular', () => {
  let component: AddCircular;
  let fixture: ComponentFixture<AddCircular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCircular]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddCircular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
