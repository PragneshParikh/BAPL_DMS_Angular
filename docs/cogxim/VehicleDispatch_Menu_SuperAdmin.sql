/* =====================================================================================
   Vehicle Dispatch menu  -  SuperAdmin only
   Database : BAPLDMSvad
   Creates  : MenuMaster 139  "Vehicle Dispatch"            (parent menu)
              MenuMaster 140  "Vehicle Dispatch Import"     -> vehicle-dispatch-import   (route data [140])
              MenuMaster 141  "Vehicle Dispatch Report"     -> vehicle-dispatch-report   (route data [141])
              RoleWiseMenuRights for the SuperAdmin role only (Permission 31 = View+Create+Edit+Delete+Download)
   Safe to run again: existing rows are not duplicated.
   If 139/140/141 are already used by other menus the script stops without changing anything;
   then choose 3 free ids here AND change data: [140] / [141] in app.routes.ts to match.
   ===================================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ParentId INT = 139, @ImportId INT = 140, @ReportId INT = 141;
DECLARE @ParentName VARCHAR(500) = 'Vehicle Dispatch',
        @ImportName VARCHAR(500) = 'Vehicle Dispatch Import',
        @ReportName VARCHAR(500) = 'Vehicle Dispatch Report';

-- 1. the ids must be free (or already hold these same menus from an earlier run)
IF EXISTS (SELECT 1 FROM dbo.MenuMaster
           WHERE (id = @ParentId AND menuName <> @ParentName)
              OR (id = @ImportId AND menuName <> @ImportName)
              OR (id = @ReportId AND menuName <> @ReportName))
BEGIN
    SELECT id, menuName, parentMenuId, pathName FROM dbo.MenuMaster WHERE id IN (@ParentId, @ImportId, @ReportId);
    RAISERROR('MenuMaster id 139/140/141 already used by another menu - nothing changed. Pick free ids (see SELECT MAX(id) FROM MenuMaster) and update app.routes.ts.', 16, 1);
    RETURN;
END

-- 2. SuperAdmin role
DECLARE @SuperAdminRoleId NVARCHAR(450) =
    (SELECT TOP 1 Id FROM dbo.AspNetRoles WHERE NormalizedName = 'SUPERADMIN' OR LOWER(Name) = 'superadmin');
IF @SuperAdminRoleId IS NULL
BEGIN
    SELECT Id, Name FROM dbo.AspNetRoles;
    RAISERROR('SuperAdmin role not found in AspNetRoles - nothing changed.', 16, 1);
    RETURN;
END

-- 3. same moduleName / path style as the existing Cogxim Sale Import menu (137)
DECLARE @Module VARCHAR(50), @RefPath VARCHAR(1000);
SELECT TOP 1 @Module = moduleName, @RefPath = pathName FROM dbo.MenuMaster WHERE pathName LIKE '%vehicle-sale-import%';
DECLARE @Slash VARCHAR(1) = CASE WHEN LEFT(ISNULL(@RefPath, ''), 1) = '/' THEN '/' ELSE '' END;
DECLARE @ParentSerial INT = ISNULL((SELECT MAX(serialNo) FROM dbo.MenuMaster WHERE parentMenuId IS NULL), 0) + 1;
DECLARE @IsIdentity BIT = ISNULL(COLUMNPROPERTY(OBJECT_ID('dbo.MenuMaster'), 'id', 'IsIdentity'), 0);

BEGIN TRANSACTION;

    DECLARE @Ins NVARCHAR(MAX) = N'
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        SELECT v.id, v.menuName, v.parentMenuId, v.pathName, v.serialNo, v.moduleName, ''Admin'', GETDATE()
        FROM (VALUES
            (@p, @pn, NULL, NULL,                                  @ps, @m),
            (@i, @in, @p,   @sl + ''vehicle-dispatch-import'',       1,   @m),
            (@r, @rn, @p,   @sl + ''vehicle-dispatch-report'',       2,   @m)
        ) v (id, menuName, parentMenuId, pathName, serialNo, moduleName)
        WHERE NOT EXISTS (SELECT 1 FROM dbo.MenuMaster x WHERE x.id = v.id);';

    IF @IsIdentity = 1
        SET @Ins = N'SET IDENTITY_INSERT dbo.MenuMaster ON;' + @Ins + N' SET IDENTITY_INSERT dbo.MenuMaster OFF;';

    EXEC sp_executesql @Ins,
        N'@p INT, @i INT, @r INT, @pn VARCHAR(500), @in VARCHAR(500), @rn VARCHAR(500), @ps INT, @m VARCHAR(50), @sl VARCHAR(1)',
        @p = @ParentId, @i = @ImportId, @r = @ReportId, @pn = @ParentName, @in = @ImportName, @rn = @ReportName,
        @ps = @ParentSerial, @m = @Module, @sl = @Slash;

    -- rights: SuperAdmin only (MenuId = parent, SubMenuId = page)
    INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    SELECT @SuperAdminRoleId, @ParentId, v.SubMenuId, 31, 'Admin', GETDATE()
    FROM (VALUES (@ImportId), (@ReportId)) v (SubMenuId)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x
                      WHERE x.RoleId = @SuperAdminRoleId AND x.MenuId = @ParentId AND x.SubMenuId = v.SubMenuId);

    -- make sure no other role has these menus
    DELETE FROM dbo.RoleWiseMenuRights
    WHERE RoleId <> @SuperAdminRoleId AND (MenuId = @ParentId OR SubMenuId IN (@ParentId, @ImportId, @ReportId));

COMMIT TRANSACTION;

-- 4. check
SELECT m.id, m.menuName, m.parentMenuId, m.pathName, m.serialNo, m.moduleName
FROM dbo.MenuMaster m WHERE m.id IN (@ParentId, @ImportId, @ReportId) ORDER BY m.id;

SELECT r.Name AS RoleName, w.MenuId, w.SubMenuId, w.Permission
FROM dbo.RoleWiseMenuRights w JOIN dbo.AspNetRoles r ON r.Id = w.RoleId
WHERE w.MenuId = @ParentId OR w.SubMenuId IN (@ParentId, @ImportId, @ReportId);
-- Log out and log in again as SuperAdmin to see the new menu.
