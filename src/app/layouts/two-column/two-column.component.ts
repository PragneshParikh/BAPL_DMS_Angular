import { Component, OnInit } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { RightsidebarComponent } from '../rightsidebar/rightsidebar.component';
import { TwoColumnSidebarComponent } from '../two-column-sidebar/two-column-sidebar.component';

@Component({
  selector: 'app-two-column',
  templateUrl: './two-column.component.html',
  styleUrls: ['./two-column.component.scss'],
  imports: [CommonModule, RouterOutlet, FooterComponent, SidebarComponent, TwoColumnSidebarComponent, TopbarComponent, RightsidebarComponent],
  standalone: true
})

/**
 * TwoColumnComponent
 */
export class TwoColumnComponent implements OnInit {

  constructor(private eventService: EventService) { }
  isCondensed = false;

  ngOnInit(): void {
    window.addEventListener('resize', () => {
      if (document.documentElement.getAttribute('data-layout') == "twocolumn") {
        if (document.documentElement.clientWidth <= 767) {
          this.eventService.broadcast('changeLayout', 'vertical');
          document.documentElement.setAttribute('data-layout', 'vertical');
          document.body.classList.add('twocolumn-panel');
        } else {
          this.eventService.broadcast('changeLayout', 'twocolumn');
          document.documentElement.setAttribute('data-layout', 'twocolumn');
          document.body.classList.remove('twocolumn-panel');
          document.getElementById('side-bar')?.classList.add('d-none')
        }
      }
      else {
        if (document.body.classList.contains('twocolumn-panel')) {
          if (document.documentElement.clientWidth <= 767) {
            this.eventService.broadcast('changeLayout', 'vertical');
            document.documentElement.setAttribute('data-layout', 'vertical');
          } else {
            this.eventService.broadcast('changeLayout', 'twocolumn');
            document.documentElement.setAttribute('data-layout', 'twocolumn');
            document.body.classList.remove('twocolumn-panel')
            document.getElementById('side-bar')?.classList.add('d-none')
          }
        }
      }
    })
  }

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    if (document.documentElement.clientWidth <= 767) {
      document.body.classList.toggle('vertical-sidebar-enable');
      document.getElementById('side-bar')?.classList.remove('d-none')
    } else {
      document.body.classList.toggle('twocolumn-panel');
      document.getElementById('side-bar')?.classList.add('d-none')
    }
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
    const rightBar = document.getElementById('theme-settings-offcanvas');
    if (rightBar != null) {
      rightBar.classList.toggle('show');
      rightBar.setAttribute('style', "visibility: visible;");
    }
  }

  isTwoColumnLayoutRequested() {
    return 'twocolumn' === document.documentElement.getAttribute('data-layout');

  }

  issemiboxLayoutRequested() {
    return 'semibox' === document.documentElement.getAttribute('data-layout');
  }

  onResize(event: any) {
    if (document.body.getAttribute('layout') == "twocolumn") {
      if (event.target.innerWidth <= 767) {
        this.eventService.broadcast('changeLayout', 'vertical');
      } else {
        this.eventService.broadcast('changeLayout', 'twocolumn');
        document.body.classList.remove('twocolumn-panel');
        document.body.classList.remove('vertical-sidebar-enable');
      }
    }
  }
}
