import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { rootReducer } from './store';
import { provideEffects } from '@ngrx/effects';
import { AuthenticationEffects } from './store/Authentication/authentication.effects';
import { EcommerceEffects } from './store/Ecommerce/ecommerce_effect';
import { ProjectEffects } from './store/Project/project_effect';
import { TaskEffects } from './store/Task/task_effect';
import { CRMEffects } from './store/CRM/crm_effect';
import { CryptoEffects } from './store/Crypto/crypto_effect';
import { InvoiceEffects } from './store/Invoice/invoice_effect';
import { TicketEffects } from './store/Ticket/ticket_effect';
import { FileManagerEffects } from './store/File Manager/filemanager_effect';
import { TodoEffects } from './store/Todo/todo_effect';
import { ApplicationEffects } from './store/Jobs/jobs_effect';
import { ApikeyEffects } from './store/APIKey/apikey_effect';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import { authInterceptor } from './core/services/auth.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      FormsModule,
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    // NGRX STORE
    provideStore(rootReducer),
    provideEffects([
      AuthenticationEffects,
      EcommerceEffects,
      ProjectEffects,
      TaskEffects,
      CRMEffects,
      CryptoEffects,
      InvoiceEffects,
      TicketEffects,
      FileManagerEffects,
      TodoEffects,
      ApplicationEffects,
      ApikeyEffects
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production
    }),
    provideHttpClient(),
    provideAnimationsAsync(),
  ]
};
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


