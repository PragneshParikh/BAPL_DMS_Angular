import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule, NgbAccordionModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

// Swiper Slider
import { SlickCarouselModule } from 'ngx-slick-carousel';

// Counter
import { CountUpModule } from 'ngx-countup';

import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { ScrollspyDirective } from './scrollspy.directive';
import { LandingScrollspyDirective } from './landingscrollspy.directive';

// Job Landing 


@NgModule({
  declarations: [
    BreadcrumbsComponent,
    ScrollspyDirective,
    LandingScrollspyDirective
  ],
  imports: [
    CommonModule,
    NgbNavModule,
    NgbAccordionModule,
    NgbDropdownModule,
    SlickCarouselModule,
    CountUpModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [BreadcrumbsComponent, ScrollspyDirective, LandingScrollspyDirective]
})
export class SharedModule { }
