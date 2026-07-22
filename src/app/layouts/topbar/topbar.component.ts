import { Component, OnInit, EventEmitter, Output, Inject, ViewChild, TemplateRef, DOCUMENT } from '@angular/core';

//Logout
import { AuthenticationService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

// Language
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbDropdownModule, NgbModal, NgbNavModule, NgbAccordionItem } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SimplebarAngularModule } from 'simplebar-angular';
import { MenuService } from '../../core/services/menu-service';
import { saleInvoice } from './data';
import { map, Observable, of } from 'rxjs';
import { LoaderService } from '../../core/services/loader';
import { InvoiceDetail } from '../../dialogs/invoice-detail/invoice-detail';
import { StorageService } from '../../core/services/storage';
import { LotInspectionService } from '../../core/services/lotinspectionservice';
import { ToastService } from '../../shared/toaster/toast-service';
import { VehicleInwardService } from '../../core/services/vehicle-inwardservice';
import { PartsInwardService } from '../../core/services/partsinwardservice';
import { PartInward } from '../../components/part-inward/part-inward';
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
    NgbDropdownModule,
    RouterLink,
    NgbAccordionItem
  ],
  standalone: true
})
export class TopbarComponent implements OnInit {
  partsInward: any[] = [];
  vehicleInward: any[] = [];
  d2dNotificationList: any[] = [];
  invoiceNotifications: any[] = [];
  partsNotifications: any[] = [];
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
  public selectedOption: string = 'ShowRoom';
  dealerCode: string = '';

  menuList: any[] = [];
  searchResults: any[] = [];

  constructor(
    @Inject(DOCUMENT) private document: any,
    public languageService: LanguageService,
    private modalService: NgbModal,
    public _cookiesService: CookieService,
    public translate: TranslateService,
    private authService: AuthenticationService,
    private router: Router,
    private menuService: MenuService,
    private vehicleInwardService: VehicleInwardService,
    private loader: LoaderService,
    private storageService: StorageService,
    private lotInspectionService: LotInspectionService,
    private toastService: ToastService,
    private partInwardService: PartsInwardService
  ) { }

  ngOnInit(): void {
    this.userData = this.authService.currentUserValue;

    if (!this.userData) {
      this.router.navigate(['/login']);
      return;
    }

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

    this.dealerCode = this.storageService.getDealerCode();

    this.getVehicleDispatchNotification();
    this.getPartsInwardNotification();
    this.getD2DVehicleNotification();

    // Fetch Data
    this.saleInvoice = saleInvoice;
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
      this.storageService.setSelectedModule(option);
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

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    } else {
      this.isDropdownOpen = true;
    }
  }
  // Search Topbar
  async Search() {
    var searchOptions = document.getElementById("search-close-options") as HTMLAreaElement;
    var dropdown = document.getElementById("search-dropdown") as HTMLAreaElement;
    var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
    input = document.getElementById("search-options") as HTMLAreaElement;
    filter = input.value.toUpperCase();
    var inputLength = filter.length;

    if (this.menuList.length === 0) {
      await this.getMenuList();
    }

    this.searchResults = this.menuList
      .flatMap(item => this.searchItemsWithLink(item, filter));

    if (inputLength > 0) {
      dropdown.classList.add("show");
      searchOptions.classList.remove("d-none");
      var inputVal = input.value.toLowerCase();
      var notifyItem = document.getElementsByClassName("notify-item");

      Array.from(notifyItem).forEach(function (element: any) {
        var notifiTxt = ''
        notifiTxt = element.getElementsByTagName("span")[0].innerText.toLowerCase()
        if (notifiTxt)
          element.style.display = notifiTxt.includes(inputVal) ? "block" : "none";

      });
    } else {
      dropdown.classList.remove("show");
      searchOptions.classList.add("d-none");
    }
  }

  private searchItemsWithLink(item: any, filter: string): any[] {
    const search = filter.toLowerCase();
    let results: any[] = [];

    const matches =
      item.label?.toLowerCase().includes(search) && item.link != null;

    // Include item ONLY if it has link and matches
    if (matches) {
      results.push(item);
    }

    // Traverse subItems
    if (item.subItems && item.subItems.length > 0) {
      item.subItems.forEach(sub => {
        results = results.concat(
          this.searchItemsWithLink(sub, filter)
        );
      });
    }

    return results;
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

  calculatenotification() {
    this.totalNotify = 0;
    this.checkedValGet = []

    this.checkedValGet.length > 0 ? (document.getElementById("notification-actions") as HTMLElement).style.display = 'block' : (document.getElementById("notification-actions") as HTMLElement).style.display = 'none';
    if (this.totalNotify == 0) {
      document.querySelector('.empty-notification-elem')?.classList.remove('d-none')
    }
  }
  getVehicleDispatchNotification() {
    this.loader.show();
    this.vehicleInwardService.getByVehicleStatus(false, this.dealerCode).subscribe({
      next: (result) => {
        console.log(result);

        this.vehicleInward = result;

        // Group by invoice number
        const groupedInvoices = this.vehicleInward.filter((p: any) => !p.isD2d).reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              status: 'Received' // You can adjust this based on your logic
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.invoiceNotifications = Object.values(groupedInvoices);

        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }
    });
  }

  getD2DVehicleNotification() {
    this.loader.show();
    this.vehicleInwardService.getByVehicleStatus(false, this.dealerCode).subscribe({
      next: (result) => {
        console.log(result);

        this.vehicleInward = result;

        // Group by invoice number
        const groupedInvoices = this.vehicleInward.filter((p: any) => p.isD2d).reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              issuedFrom: item.issuedDealerName,
              issuedDealerCode: item.issuedDealerCode,
              status: 'Received' // You can adjust this based on your logic
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.d2dNotificationList = Object.values(groupedInvoices);
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }
    });
  }
  getPartsInwardNotification() {
    this.partInwardService.getPendingNotificationByDealer(this.dealerCode).subscribe({
      next: (res: any) => {
        this.partsInward = res;
        // Group by invoice number
        const groupedInvoices = this.partsInward.reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              status: 'Received' // You can adjust this based on your logic
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.partsNotifications = Object.values(groupedInvoices);

        this.loader.hide();
      }, error: (err) => {
        this.toastService.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
        console.error(err);
      }
    });
  }

  onClickInvoiceNumber(invoiceData) {

    const modalRef = this.modalService.open(InvoiceDetail, {
      size: 'xl',      // modal size: 'sm', 'lg', 'xl'
      backdrop: 'static', // prevent closing by clicking outside
      keyboard: false    // prevent closing with ESC
    });

    const invoiceDetails = this.vehicleInward.filter(x => x.invoiceNo === invoiceData.invoiceNumber);
    // Pass data to the modal component
    modalRef.componentInstance.invoiceDetails = invoiceDetails;
    modalRef.componentInstance.sourceType = 'vehicle';

    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          this.loader.show();
          this.lotInspectionService.acceptInvoiceHeader(invoiceData.invoiceNumber).subscribe({
            next: (res) => {
              this.updateNotificationStatusByInvoice(invoiceData.invoiceNumber);
              this.loader.hide();
            },
            error: (err) => {
              this.loader.hide();
              console.error(err);
            }
          });
        }
      },
      (reason) => {
      }
    );
  }
  updateNotificationStatusByInvoice(invoiceNumber: string) {
    this.vehicleInwardService.updateStatusByInvoiceNumber(invoiceNumber).subscribe({
      next: (res) => {
        this.toastService.show('Record updated sucessfully', {
          classname: 'bg-success text-white',
          delay: 5000
        });

        this.getVehicleDispatchNotification();

        this.router.navigate(['/lot-inspection-details', invoiceNumber]);

      }, error: (err) => {
        this.toastService.show('Something went wrong', {
          classname: 'bg-warning text-white',
          delay: 5000
        });
        console.error(err);
      }
    })
  }

  async getMenuList(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.menuService.getMenu().subscribe({
        next: (menu: any) => {
          this.menuList = menu;
          resolve(menu);
          this.loader.hide();
        }, error: (err) => {
          console.error('Error fetching menu:', err);
          reject(err);
          this.loader.hide();
        }
      });
    });
  }

  onClickPartNumber(item: any) {
    const invoiceNo = item?.invoiceNumber || '0';
    const value = Date.now() + '|' + invoiceNo;
    const encClaim = btoa(value);
    this.router.navigate(['parts-inward', encClaim])

    // const modalRef = this.modalService.open(PartInward, {
    //   size: 'xl',      // modal size: 'sm', 'lg', 'xl'
    //   backdrop: 'static', // prevent closing by clicking outside
    //   keyboard: false    // prevent closing with ESC
    // });

    // const invoiceDetails = this.partsInward.filter(x => x.invoiceNo === item.invoiceNumber);
    // modalRef.componentInstance.invoiceDetails = invoiceDetails;
    // modalRef.componentInstance.sourceType = 'parts';

    // modalRef.result.then(
    //   (result) => {
    //     if (result && result.isAccepted) {
    //       this.loader.show();
    //       this.updatePartInwardStatusByInvoice(item.invoiceNumber);
    //       this.loader.hide();
    //     }
    //   },
    //   (reason) => {
    //   }
    // );

  }

  // updatePartInwardStatusByInvoice(invoiceNumber: string) {
  //   this.partInwardService.update(invoiceNumber).subscribe({
  //     next: (res) => {
  //       this.toastService.show('Record updated sucessfully', {
  //         classname: 'bg-success text-white',
  //         delay: 5000
  //       });
  //     }, error: (err) => {
  //       this.toastService.show('Something went wrong', {
  //         classname: 'bg-danger text-white',
  //         delay: 5000
  //       });
  //       console.error(err);
  //     }
  //   });
  // }
}