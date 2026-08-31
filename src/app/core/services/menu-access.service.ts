import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { StorageService } from './storage';
import { environment } from '../../../environments/environment';

export enum MenuPermissionBit {
  View = 1,
  Create = 2,
  Edit = 4,
  Delete = 8,
  Download = 16
}

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private baseUrl = environment.apiUrl;

  constructor(
    private storageService: StorageService,
    private http: HttpClient
  ) {}

  hasPermission(subMenuId: number, bit: MenuPermissionBit): boolean {
    const rights = this.storageService.getMenuRights();
    if (!rights || !Array.isArray(rights)) return true; // fail-open for SuperAdmin/roles with no restriction rows

    const match = rights.find((r: any) => r.subMenuId === subMenuId);
    if (!match) return false;

    return (Number(match.permission) & bit) === bit;
  }

  canView(subMenuId: number): boolean { return this.hasPermission(subMenuId, MenuPermissionBit.View); }
  canCreate(subMenuId: number): boolean { return this.hasPermission(subMenuId, MenuPermissionBit.Create); }
  canEdit(subMenuId: number): boolean { return this.hasPermission(subMenuId, MenuPermissionBit.Edit); }
  canDelete(subMenuId: number): boolean { return this.hasPermission(subMenuId, MenuPermissionBit.Delete); }
  canDownload(subMenuId: number): boolean { return this.hasPermission(subMenuId, MenuPermissionBit.Download); }

  // FIX: now returns Observable<void> so callers can .subscribe() and know
  // exactly when the refreshed rights have actually landed in storage,
  // instead of firing-and-forgetting with no way to sequence follow-up work.
  refreshMenuRights(): Observable<void> {
    const dealerCode = this.storageService.getDealerCode();
    if (!dealerCode) {
      return of(void 0);
    }

    return this.http.get<any[]>(`${this.baseUrl}/menu-rights/${dealerCode}`).pipe(
      tap((menuGroups: any[]) => {
        // Flatten the group/subMenu tree into the flat { subMenuId, permission }[]
        // shape hasPermission() expects — same shape stored at login time.
        const flat = (menuGroups || []).flatMap((g: any) =>
          (g.subMenus || []).map((s: any) => ({
            subMenuId: s.subMenuId,
            permission: s.permission
          }))
        );
        this.storageService.setMenuRights(flat);
      }),
      map(() => void 0)
    );
  }
}