import { Component, OnInit, EventEmitter, Output, Inject, ViewChild, TemplateRef, DOCUMENT } from '@angular/core';

import { EventService } from '../../core/services/event.service';

//Logout
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { Router } from '@angular/router';
import { TokenStorageService } from '../../core/services/token-storage.service';

// Language
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbDropdownModule, NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SimplebarAngularModule } from 'simplebar-angular';
import { MenuService } from '../../core/services/menu-service';
import { partsDispatch, saleInvoice, vehicleDispatch } from './data';
import { map, Observable, of } from 'rxjs';
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  imports: [
    CommonModule,
    NgbNavModule,
    FormsModule,
    ReactiveFormsModule,
    SimplebarAngularModule,
    NgbDropdownModule
  ],
  standalone: true
})
export class TopbarComponent implements OnInit {
  partsDispatch: any[] = [];
  vehicleDispatch: any[] = [];
  saleInvoice: any[] = [];
  element: any;
  mode: string | undefined;
  @Output() mobileMenuButtonClicked = new EventEmitter();
  flagvalue: any;
  valueset: any;
  countryName: any;
  cookieValue: any;
  userData: any;
  total = 0;
  totalNotify: number = 0;
  newNotify: number = 0;
  readNotify: number = 0;
  isDropdownOpen = false;
  lastLoginDate$: Observable<string>;
  @ViewChild('removenotification') removenotification !: TemplateRef<any>;
  notifyId: any;
  unReadInwards: number = 0;
  public selectedOption: string = localStorage.getItem('selectedModule') ? JSON.parse(localStorage.getItem('selectedModule') || '{}') : 'ShowRoom';

  constructor(@Inject(DOCUMENT) private document: any, private eventService: EventService, public languageService: LanguageService, private modalService: NgbModal,
    public _cookiesService: CookieService, public translate: TranslateService, private authService: AuthenticationService, private authFackservice: AuthfakeauthenticationService,
    private router: Router, private TokenStorageService: TokenStorageService,
    private menuService: MenuService) { }

  ngOnInit(): void {
    this.userData = this.authService.currentUserValue;
    this.element = document.documentElement;

    this.lastLoginDate$ = of(this.userData.lastLoginDate).pipe(
      map(dateStr => {
        if (!dateStr) return '';
        const d = new Date(dateStr);

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 → 12 for midnight
        const hoursStr = hours.toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
      })
    );

    // Fetch Data
    this.saleInvoice = saleInvoice;
    this.partsDispatch = partsDispatch;
    this.vehicleDispatch = vehicleDispatch;
  }

  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    document.querySelector('.hamburger-icon')?.classList.toggle('open')
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }
  /**
* Open modal
* @param content modal content
*/
  openModal(content: any) {
    // this.submitted = false;
    this.modalService.open(content, { centered: true });
  }

  onSelectionChange(option: string) {
    if (option !== this.selectedOption) {
      this.selectedOption = option;
      localStorage.setItem('selectedModule', JSON.stringify(option));
      this.menuService.filterMenu(option);
      this.router.navigate(['/']);
    }
  }

  /**
   * Logout the user
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  windowScroll() {
    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
      // (document.getElementById("back-to-top") as HTMLElement).style.display = "block";
      document.getElementById('page-topbar')?.classList.add('topbar-shadow');
    } else {
      // (document.getElementById("back-to-top") as HTMLElement).style.display = "none";
      document.getElementById('page-topbar')?.classList.remove('topbar-shadow');
    }
  }

  // Delete Item
  // deleteItem(event: any, id: any) {
  //   var price = event.target.closest('.dropdown-item').querySelector('.item_price').innerHTML;
  //   var Total_price = this.total - price;
  //   this.total = Total_price;
  //   this.cart_length = this.cart_length - 1;
  //   this.total > 1 ? (document.getElementById("empty-cart") as HTMLElement).style.display = "none" : (document.getElementById("empty-cart") as HTMLElement).style.display = "block";
  //   document.getElementById('item_' + id)?.remove();
  // }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    } else {
      this.isDropdownOpen = true;
    }
  }
  // Search Topbar
  Search() {
    var searchOptions = document.getElementById("search-close-options") as HTMLAreaElement;
    var dropdown = document.getElementById("search-dropdown") as HTMLAreaElement;
    var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
    input = document.getElementById("search-options") as HTMLAreaElement;
    filter = input.value.toUpperCase();
    var inputLength = filter.length;

    if (inputLength > 0) {
      dropdown.classList.add("show");
      searchOptions.classList.remove("d-none");
      var inputVal = input.value.toUpperCase();
      var notifyItem = document.getElementsByClassName("notify-item");

      Array.from(notifyItem).forEach(function (element: any) {
        var notifiTxt = ''
        if (element.querySelector("h6")) {
          var spantext = element.getElementsByTagName("span")[0].innerText.toLowerCase()
          var name = element.querySelector("h6").innerText.toLowerCase()
          if (name.includes(inputVal)) {
            notifiTxt = name
          } else {
            notifiTxt = spantext
          }
        } else if (element.getElementsByTagName("span")) {
          notifiTxt = element.getElementsByTagName("span")[0].innerText.toLowerCase()
        }
        if (notifiTxt)
          element.style.display = notifiTxt.includes(inputVal) ? "block" : "none";

      });
    } else {
      dropdown.classList.remove("show");
      searchOptions.classList.add("d-none");
    }
  }

  /**
   * Search Close Btn
   */
  closeBtn() {
    var searchOptions = document.getElementById("search-close-options") as HTMLAreaElement;
    var dropdown = document.getElementById("search-dropdown") as HTMLAreaElement;
    var searchInputReponsive = document.getElementById("search-options") as HTMLInputElement;
    dropdown.classList.remove("show");
    searchOptions.classList.add("d-none");
    searchInputReponsive.value = "";
  }

  // Remove Notification
  checkedValGet: any[] = [];
  // onCheckboxChange(event: any, id: any) {
  //   this.notifyId = id
  //   var result;
  //   if (id == '1') {
  //     var checkedVal: any[] = [];
  //     for (var i = 0; i < this.allnotifications.length; i++) {
  //       if (this.allnotifications[i].state == true) {
  //         result = this.allnotifications[i].id;
  //         checkedVal.push(result);
  //       }
  //     }
  //     this.checkedValGet = checkedVal;
  //   } else {
  //     var checkedVal: any[] = [];
  //     for (var i = 0; i < this.messages.length; i++) {
  //       if (this.messages[i].state == true) {
  //         result = this.messages[i].id;
  //         checkedVal.push(result);
  //       }
  //     }
  //     this.checkedValGet = checkedVal;
  //   }
  //   checkedVal.length > 0 ? (document.getElementById("notification-actions") as HTMLElement).style.display = 'block' : (document.getElementById("notification-actions") as HTMLElement).style.display = 'none';
  // }

  // notificationDelete() {
  //   if (this.notifyId == '1') {
  //     for (var i = 0; i < this.checkedValGet.length; i++) {
  //       for (var j = 0; j < this.allnotifications.length; j++) {
  //         if (this.allnotifications[j].id == this.checkedValGet[i]) {
  //           this.allnotifications.splice(j, 1)
  //         }
  //       }
  //     }
  //   } else {
  //     for (var i = 0; i < this.checkedValGet.length; i++) {
  //       for (var j = 0; j < this.messages.length; j++) {
  //         if (this.messages[j].id == this.checkedValGet[i]) {
  //           this.messages.splice(j, 1)
  //         }
  //       }
  //     }
  //   }
  //   this.calculatenotification()
  //   this.modalService.dismissAll();
  // }

  calculatenotification() {
    this.totalNotify = 0;
    this.checkedValGet = []

    this.checkedValGet.length > 0 ? (document.getElementById("notification-actions") as HTMLElement).style.display = 'block' : (document.getElementById("notification-actions") as HTMLElement).style.display = 'none';
    if (this.totalNotify == 0) {
      document.querySelector('.empty-notification-elem')?.classList.remove('d-none')
    }
  }
}