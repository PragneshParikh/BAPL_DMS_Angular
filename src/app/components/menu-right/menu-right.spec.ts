import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuRight } from './menu-right';

describe('MenuRight', () => {
  let component: MenuRight;
  let fixture: ComponentFixture<MenuRight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuRight]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuRight);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
