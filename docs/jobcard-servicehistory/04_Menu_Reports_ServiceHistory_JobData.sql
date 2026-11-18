/* =====================================================================================
   Reports menu: Service History + Job Data (imported service history, dbo.JobCardServiceHistory)
   Database : BAPLDMSvad
   Creates  : MenuMaster 147 "Service History" -> /service-history  (route data [147])
              MenuMaster 148 "Job Data"        -> /job-data         (route data [148])
              both under Reports (parentMenuId 21), moduleName 'workshop', serialNo after the last Reports page
              RoleWiseMenuRights for SuperAdmin (Permission 31). Admin is optional - see step 4.
   Checked 04.11.2026 (read-only): MAX(MenuMaster.id) = 146; 145 = Free Service, 146 = Jobcard Servicehistory Import;
              Reports (21) children use serialNo up to 72 (Vehicle Dispatch Report).

   *** DO NOT RUN ON PRODUCTION WITHOUT APPROVAL ***
   Safe to run again. If 147 / 148 are taken by other menus by then, the script stops without changing anything;
   pick free ids here AND change data: [147] / [148] in app.routes.ts to match.
   ===================================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ParentId INT = 21;                                   -- Reports
DECLARE @ShId INT = 148 - 1, @JdId INT = 148;                 -- 147, 148
DECLARE @ShName VARCHAR(500) = 'Service History', @JdName VARCHAR(500) = 'Job Data';

-- 1. checks
IF NOT EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = @ParentId AND menuName = 'Reports')
BEGIN
    RAISERROR('MenuMaster 21 is not "Reports" - nothing changed.', 16, 1);
    RETURN;
END
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE (id = @ShId AND menuName <> @ShName) OR (id = @JdId AND menuName <> @JdName))
BEGIN
    SELECT id, menuName, parentMenuId, pathName FROM dbo.MenuMaster WHERE id IN (@ShId, @JdId);
    RAISERROR('MenuMaster id 147 / 148 already used by another menu - nothing changed. Pick free ids (SELECT MAX(id) FROM MenuMaster) and update app.routes.ts.', 16, 1);
    RETURN;
END

DECLARE @SuperAdminRoleId NVARCHAR(450) =
    (SELECT TOP 1 Id FROM dbo.AspNetRoles WHERE NormalizedName = 'SUPERADMIN' OR LOWER(Name) = 'superadmin');
IF @SuperAdminRoleId IS NULL
BEGIN
    RAISERROR('SuperAdmin role not found in AspNetRoles - nothing changed.', 16, 1);
    RETURN;
END

DECLARE @Serial INT = ISNULL((SELECT MAX(serialNo) FROM dbo.MenuMaster WHERE parentMenuId = @ParentId), 0);
DECLARE @IsIdentity BIT = ISNULL(COLUMNPROPERTY(OBJECT_ID('dbo.MenuMaster'), 'id', 'IsIdentity'), 0);

BEGIN TRANSACTION;

    -- 2. menus (same path style as the other Reports pages: leading '/')
    DECLARE @Ins NVARCHAR(MAX) = N'
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        SELECT v.id, v.menuName, @parent, v.pathName, v.serialNo, ''workshop'', ''Admin'', GETDATE()
        FROM (VALUES (@sh, @shName, ''/service-history'', @serial + 1),
                     (@jd, @jdName, ''/job-data'',        @serial + 2)) v (id, menuName, pathName, serialNo)
        WHERE NOT EXISTS (SELECT 1 FROM dbo.MenuMaster x WHERE x.id = v.id);';
    IF @IsIdentity = 1
        SET @Ins = N'SET IDENTITY_INSERT dbo.MenuMaster ON;' + @Ins + N' SET IDENTITY_INSERT dbo.MenuMaster OFF;';

    EXEC sp_executesql @Ins,
        N'@parent INT, @sh INT, @jd INT, @shName VARCHAR(500), @jdName VARCHAR(500), @serial INT',
        @parent = @ParentId, @sh = @ShId, @jd = @JdId, @shName = @ShName, @jdName = @JdName, @serial = @Serial;

    -- 3. SuperAdmin rights (MenuId = parent, SubMenuId = page; 31 = View+Create+Edit+Delete+Download)
    INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    SELECT @SuperAdminRoleId, @ParentId, v.id, 31, 'Admin', GETDATE()
    FROM (VALUES (@ShId), (@JdId)) v (id)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x WHERE x.RoleId = @SuperAdminRoleId AND x.SubMenuId = v.id);

    -- 4. OPTIONAL - the API also allows Admin. Uncomment to give the Admin role both pages.
    -- INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    -- SELECT r.Id, @ParentId, v.id, 31, 'Admin', GETDATE()
    -- FROM dbo.AspNetRoles r CROSS JOIN (VALUES (@ShId), (@JdId)) v (id)
    -- WHERE (r.NormalizedName = 'ADMIN' OR LOWER(r.Name) = 'admin')
    --   AND NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x WHERE x.RoleId = r.Id AND x.SubMenuId = v.id);

    IF @IsIdentity = 1
    BEGIN
        DECLARE @MaxId INT = (SELECT MAX(id) FROM dbo.MenuMaster);
        DBCC CHECKIDENT ('dbo.MenuMaster', RESEED, @MaxId);
    END

COMMIT TRANSACTION;

-- 5. check
SELECT m.id, m.menuName, m.parentMenuId, m.pathName, m.serialNo, m.moduleName
FROM dbo.MenuMaster m WHERE m.id IN (@ShId, @JdId) ORDER BY m.id;
SELECT r.Name AS RoleName, w.MenuId, w.SubMenuId, w.Permission
FROM dbo.RoleWiseMenuRights w JOIN dbo.AspNetRoles r ON r.Id = w.RoleId WHERE w.SubMenuId IN (@ShId, @JdId);
-- Log out and log in again to see the menus under Reports.
