import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
import { Transactions, apikeys, application, cryptoOrders, deals, folderData, projectListWidgets, recentData, sellerDetail, sellerDetals, tasks } from '../data';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // tslint:disable-next-line: max-line-length
        const users: any[] = JSON.parse(sessionStorage.getItem('users')!) || [{ username: 'admin', email: 'admin@themesbrand.com', password: '123456' }];

        // wrap in delayed observable to simulate server api call
        return of(null).pipe(mergeMap(() => {

            // authenticate
            if (request.url.endsWith('/users/authenticate') && request.method === 'POST') {
                const filteredUsers = users.filter(user => {
                    return user.email === request.body.email && user.password === request.body.password;
                });
                if (filteredUsers.length) {
                    // if login details are valid return 200 OK with user details and fake jwt token
                    const user = filteredUsers[0];
                    const body = {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        token: 'fake-jwt-token'
                    };
                    return of(new HttpResponse({ status: 200, body }));
                } else {
                    // else return 400 bad request
                    return throwError({ error: { message: 'Username or password is incorrect' } });
                }
            }

            // get users
            if (request.url.endsWith('/users') && request.method === 'GET') {
                // tslint:disable-next-line: max-line-length
                // check for fake auth token in header and return users if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    return of(new HttpResponse({ status: 200, body: users }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // get user by id
            if (request.url.match(/\/users\/\d+$/) && request.method === 'GET') {
                // tslint:disable-next-line: max-line-length
                // check for fake auth token in header and return user if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    // find user by id in users array
                    const urlParts = request.url.split('/');
                    // tslint:disable-next-line: radix
                    const id = parseInt(urlParts[urlParts.length - 1]);
                    // tslint:disable-next-line: no-shadowed-variable
                    const matchedUsers = users.filter(user => user.id === id);
                    const user = matchedUsers.length ? matchedUsers[0] : null;

                    return of(new HttpResponse({ status: 200, body: user }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // register user
            if (request.url.endsWith('/users/register') && request.method === 'POST') {
                // get new user object from post body
                const newUser = request.body;

                // validation
                const duplicateUser = users.filter(user => user.username === newUser.username).length;
                if (duplicateUser) {
                    return throwError({ error: { message: 'Username "' + newUser.username + '" is already taken' } });
                }

                // save new user
                newUser.id = users.length + 1;
                users.push(newUser);
                sessionStorage.setItem('users', JSON.stringify(users));

                // respond 200 OK
                return of(new HttpResponse({ status: 200 }));
            }

            // delete user
            if (request.url.match(/\/users\/\d+$/) && request.method === 'DELETE') {
                // tslint:disable-next-line: max-line-length
                // check for fake auth token in header and return user if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    // find user by id in users array
                    const urlParts = request.url.split('/');
                    // tslint:disable-next-line: radix
                    const id = parseInt(urlParts[urlParts.length - 1]);
                    for (let i = 0; i < users.length; i++) {
                        const user = users[i];
                        if (user.id === id) {
                            // delete user
                            users.splice(i, 1);
                            sessionStorage.setItem('users', JSON.stringify(users));
                            break;
                        }
                    }

                    // respond 200 OK
                    return of(new HttpResponse({ status: 200 }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // get seller
            if (request.url.endsWith('/app/seller') && request.method === 'GET') {
                if (sellerDetals) {
                    return of(new HttpResponse({ status: 200, body: sellerDetals }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // get Project
            if (request.url.endsWith('/app/project') && request.method === 'GET') {
                if (projectListWidgets) {
                    return of(new HttpResponse({ status: 200, body: projectListWidgets }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }


            // get Kanban
            if (request.url.endsWith('/app/kanban') && request.method === 'GET') {
                if (tasks) {
                    return of(new HttpResponse({ status: 200, body: tasks }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // get Deal
            if (request.url.endsWith('/app/deal') && request.method === 'GET') {
                if (deals) {
                    return of(new HttpResponse({ status: 200, body: deals }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // get Crypto Order
            if (request.url.endsWith('/app/cryptoOrder') && request.method === 'GET') {
                if (cryptoOrders) {
                    return of(new HttpResponse({ status: 200, body: cryptoOrders }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // get Transaction
            if (request.url.endsWith('/app/transaction') && request.method === 'GET') {
                if (Transactions) {
                    return of(new HttpResponse({ status: 200, body: Transactions }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // get folder
            if (request.url.endsWith('/app/folder') && request.method === 'GET') {
                if (folderData) {
                    return of(new HttpResponse({ status: 200, body: folderData }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            if (request.url.endsWith('/app/folder') && request.method === 'POST') {
                const newUser = request.body;
                if (folderData) {
                    return of(new HttpResponse({ status: 200, body: newUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // Update listingGrid
            if (request.url.endsWith('/app/folder') && request.method === 'PUT') {
                const updatedUser = request.body;
                if (folderData) {
                    return of(new HttpResponse({ status: 200, body: updatedUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // DELETE listingGrid
            if (request.url.endsWith('/app/folder') && request.method === 'DELETE') {
                const updatedUser = request.body;
                if (folderData) {
                    return of(new HttpResponse({ status: 200, body: updatedUser })); // respond 200 OK
                } else {
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // get file
            if (request.url.endsWith('/app/file') && request.method === 'GET') {
                if (recentData) {
                    return of(new HttpResponse({ status: 200, body: recentData }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            if (request.url.endsWith('/app/file') && request.method === 'POST') {
                const newUser = request.body;
                if (recentData) {
                    return of(new HttpResponse({ status: 200, body: newUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // Update listingGrid
            if (request.url.endsWith('/app/file') && request.method === 'PUT') {
                const updatedUser = request.body;
                if (recentData) {
                    return of(new HttpResponse({ status: 200, body: updatedUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // DELETE listingGrid
            if (request.url.endsWith('/app/file') && request.method === 'DELETE') {
                const updatedUser = request.body;
                if (recentData) {
                    return of(new HttpResponse({ status: 200, body: updatedUser })); // respond 200 OK
                } else {
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

             // get application
             if (request.url.endsWith('/app/application') && request.method === 'GET') {
                if (application) {
                    return of(new HttpResponse({ status: 200, body: application }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            if (request.url.endsWith('/app/application') && request.method === 'POST') {
                const newUser = request.body;
                if (application) {
                    return of(new HttpResponse({ status: 200, body: newUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // Update Application
            if (request.url.endsWith('/app/application') && request.method === 'PUT') {
                const updatedUser = request.body;
                if (application) {
                    return of(new HttpResponse({ status: 200, body: updatedUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // DELETE Application
            if (request.url.endsWith('/app/application') && request.method === 'DELETE') {
                const updatedUser = request.body;
                if (application) {
                    return of(new HttpResponse({ status: 200, body: updatedUser })); // respond 200 OK
                } else {
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

              // get apikey
              if (request.url.endsWith('/app/apikey') && request.method === 'GET') {
                if (apikeys) {
                    return of(new HttpResponse({ status: 200, body: apikeys }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            if (request.url.endsWith('/app/apikey') && request.method === 'POST') {
                const newUser = request.body;
                if (apikeys) {
                    return of(new HttpResponse({ status: 200, body: newUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // Update apikey
            if (request.url.endsWith('/app/apikey') && request.method === 'PUT') {
                const updatedUser = request.body;
                if (apikeys) {
                    return of(new HttpResponse({ status: 200, body: updatedUser }));
                } else {
                    return throwError({ status: 401, error: { message: 'No Data Found' } });
                }
            }

            // DELETE apikey
            if (request.url.endsWith('/app/apikey') && request.method === 'DELETE') {
                const updatedUser = request.body;
                if (apikeys) {
                    return of(new HttpResponse({ status: 200, body: updatedUser })); // respond 200 OK
                } else {
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // pass through any requests not handled above
            return next.handle(request);

        }))

            // tslint:disable-next-line: max-line-length
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize());
    }
}
