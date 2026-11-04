/* =====================================================================================
   Jobcard Servicehistory Import - Utility menu entry
   Database : BAPLDMSvad   (DMS)
   Creates  : MenuMaster 146 "Jobcard Servicehistory Import" -> /jobcard-servicehistory-import (route data [146])
              placed under the same parent menu + module as "Vehicle Sale Import" (MenuMaster 137, Utility)
              RoleWiseMenuRights for SuperAdmin (Permission 31). Admin is optional - see step 4.
   Does not change menus 137 (Vehicle Sale Import) or 140 (Vehicle Dispatch Import).

   *** DO NOT RUN ON PRODUCTION WITHOUT APPROVAL ***
   Safe to run again. If id 146 is already used by another menu the script stops without changing anything;
   then pick a free id here AND change data: [146] in app.routes.ts to match.
   ===================================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @MenuId INT = 146;   -- 145 is "Free Service" in BAPLDMSvad (checked 04.11.2026)
DECLARE @MenuName VARCHAR(500) = 'Jobcard Servicehistory Import';
DECLARE @Path VARCHAR(100) = 'jobcard-servicehistory-import';

-- 1. id must be free (or already hold this menu from an earlier run)
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = @MenuId AND menuName <> @MenuName)
BEGIN
    SELECT id, menuName, parentMenuId, pathName FROM dbo.MenuMaster WHERE id = @MenuId;
    RAISERROR('MenuMaster id 146 is already used by another menu - nothing changed. Pick a free id (SELECT MAX(id) FROM MenuMaster) and update app.routes.ts.', 16, 1);
    RETURN;
END

-- 2. same parent / module / path style as Vehicle Sale Import (137, Utility)
DECLARE @ParentId INT, @Module VARCHAR(50), @RefPath VARCHAR(1000);
SELECT @ParentId = parentMenuId, @Module = moduleName, @RefPath = pathName FROM dbo.MenuMaster WHERE id = 137;
IF @ParentId IS NULL
BEGIN
    RAISERROR('MenuMaster 137 (Vehicle Sale Import) not found - cannot find the Utility parent menu. Nothing changed.', 16, 1);
    RETURN;
END
DECLARE @Slash VARCHAR(1) = CASE WHEN LEFT(ISNULL(@RefPath, ''), 1) = '/' THEN '/' ELSE '' END;
DECLARE @Serial INT = ISNULL((SELECT MAX(serialNo) FROM dbo.MenuMaster WHERE parentMenuId = @ParentId), 0) + 1;
DECLARE @IsIdentity BIT = ISNULL(COLUMNPROPERTY(OBJECT_ID('dbo.MenuMaster'), 'id', 'IsIdentity'), 0);

DECLARE @SuperAdminRoleId NVARCHAR(450) =
    (SELECT TOP 1 Id FROM dbo.AspNetRoles WHERE NormalizedName = 'SUPERADMIN' OR LOWER(Name) = 'superadmin');
IF @SuperAdminRoleId IS NULL
BEGIN
    RAISERROR('SuperAdmin role not found in AspNetRoles - nothing changed.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

    DECLARE @Ins NVARCHAR(MAX) = N'
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        SELECT @id, @name, @parent, @sl + @path, @serial, @m, ''Admin'', GETDATE()
        WHERE NOT EXISTS (SELECT 1 FROM dbo.MenuMaster x WHERE x.id = @id);';
    IF @IsIdentity = 1
        SET @Ins = N'SET IDENTITY_INSERT dbo.MenuMaster ON;' + @Ins + N' SET IDENTITY_INSERT dbo.MenuMaster OFF;';

    EXEC sp_executesql @Ins,
        N'@id INT, @name VARCHAR(500), @parent INT, @sl VARCHAR(1), @path VARCHAR(100), @serial INT, @m VARCHAR(50)',
        @id = @MenuId, @name = @MenuName, @parent = @ParentId, @sl = @Slash, @path = @Path, @serial = @Serial, @m = @Module;

    -- 3. SuperAdmin rights (MenuId = parent, SubMenuId = page; 31 = View+Create+Edit+Delete+Download)
    INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    SELECT @SuperAdminRoleId, @ParentId, @MenuId, 31, 'Admin', GETDATE()
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x WHERE x.RoleId = @SuperAdminRoleId AND x.SubMenuId = @MenuId);

    -- 4. OPTIONAL - the API also allows Admin. Uncomment to give the Admin role the menu as well.
    -- INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    -- SELECT r.Id, @ParentId, @MenuId, 31, 'Admin', GETDATE() FROM dbo.AspNetRoles r
    -- WHERE (r.NormalizedName = 'ADMIN' OR LOWER(r.Name) = 'admin')
    --   AND NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x WHERE x.RoleId = r.Id AND x.SubMenuId = @MenuId);

    IF @IsIdentity = 1
    BEGIN
        DECLARE @MaxId INT = (SELECT MAX(id) FROM dbo.MenuMaster);
        DBCC CHECKIDENT ('dbo.MenuMaster', RESEED, @MaxId);
    END

COMMIT TRANSACTION;

-- 5. check
SELECT m.id, m.menuName, m.parentMenuId, m.pathName, m.serialNo, m.moduleName
FROM dbo.MenuMaster m WHERE m.id IN (137, 140, @MenuId) ORDER BY m.id;
SELECT r.Name AS RoleName, w.MenuId, w.SubMenuId, w.Permission
FROM dbo.RoleWiseMenuRights w JOIN dbo.AspNetRoles r ON r.Id = w.RoleId WHERE w.SubMenuId = @MenuId;
-- Log out and log in again to see the menu.
