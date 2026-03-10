import { Directive, Input, EventEmitter, Inject, Output, ElementRef, HostListener, DOCUMENT } from '@angular/core';


@Directive({
    selector: '[appScrollspy]',
    standalone: false
})
export class LandingScrollspyDirective {

  @Input() public spiedTags : string[] = [];;
  @Output() public sectionChange = new EventEmitter<string>();
  private currentSection: string | undefined;

  // tslint:disable-next-line: variable-name
  constructor(private _el: ElementRef, @Inject(DOCUMENT) private document: Document,) { }

  @HostListener('window:scroll', ['$event'])
  /**
   * Window scroll method
   */
  onScroll(event: any) {
    let currentSection!: string;
    const children = this._el.nativeElement.querySelectorAll('section');
    const scrollTop = this.document.documentElement.scrollTop;
    const parentOffset = this.document.documentElement.offsetTop;

    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      if (this.spiedTags.some(spiedTag => spiedTag === element.tagName)) {
        if ((element.offsetTop - parentOffset) <= scrollTop) {
          currentSection = element.id;
        }
      }
    }
    if (currentSection !== this.currentSection) {
      this.currentSection = currentSection;
      this.sectionChange.emit(this.currentSection);
    }
  }
}
