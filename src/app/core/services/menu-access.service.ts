import { Injectable } from '@angular/core';
import { StorageService } from './storage';

export enum MenuPermissionBit {
  View = 1,
  Create = 2,
  Edit = 4,
  Delete = 8,
  Download = 16
}

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  constructor(private storageService: StorageService) {}

  /**
   * Checks whether the current user's saved menu rights include the given
   * action bit for a specific SubMenuId. Reads from StorageService's cached
   * menuRights (populated at login via RoleWiseMenuRights), so this never
   * needs a fresh API call per check.
   */
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
}