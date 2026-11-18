/* =====================================================================================
   BGauss DMS - Dashboard (MenuMaster 131) sub-menus per module          (BAPLDMSvad)
   Sidebar shows a sub-menu only for the module selected at the top (ShowRoom / WorkShop / Account).

   ShowRoom : 132 Overview (/) . 133 Dealer Analytics . 134 Sales Analytics . 135 Stock Analytics
   WorkShop : 142 Overview (/) . 138 Job Card Dashboard   (/workshop-analytics)  route data [138]
   Account  : 143 Overview (/) . 144 Account Dashboard    (/account-dashboard)   route data [144]

   Rights: every role that already has Dashboard > Overview (132) gets the new menus
   with the SAME permission it has on 132. Safe to run again.
   ===================================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ids must be free (or already hold the same page) - stop before changing anything
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 138 AND ISNULL(pathName, '') <> '/workshop-analytics')
    THROW 50001, 'MenuMaster id 138 is used by another menu - nothing changed.', 1;
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 142 AND NOT (ISNULL(pathName, '') = '/' AND moduleName = 'workshop'))
    THROW 50002, 'MenuMaster id 142 is used by another menu - nothing changed.', 1;
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 143 AND NOT (ISNULL(pathName, '') = '/' AND moduleName = 'account'))
    THROW 50003, 'MenuMaster id 143 is used by another menu - nothing changed.', 1;
IF EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 144 AND ISNULL(pathName, '') <> '/account-dashboard')
    THROW 50004, 'MenuMaster id 144 is used by another menu - nothing changed.', 1;

BEGIN TRANSACTION;

    /* 1. existing analytics -> ShowRoom */
    UPDATE dbo.MenuMaster
       SET moduleName = 'showroom',
           serialNo   = CASE id WHEN 132 THEN 1 WHEN 133 THEN 2 WHEN 134 THEN 3 WHEN 135 THEN 4 END,
           UpdatedBy  = 'Admin', UpdatedDate = GETDATE()
     WHERE id IN (132, 133, 134, 135) AND parentMenuId = 131;

    /* 2. new menus with fixed ids (they match app.routes.ts) */
    DECLARE @Old INT = (SELECT TOP 1 id FROM dbo.MenuMaster WHERE pathName = '/workshop-analytics' AND id <> 138);

    SET IDENTITY_INSERT dbo.MenuMaster ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 138)
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        VALUES (138, 'Job Card Dashboard', 131, '/workshop-analytics', 2, 'workshop', 'Admin', GETDATE());
    ELSE
        UPDATE dbo.MenuMaster SET menuName = 'Job Card Dashboard', parentMenuId = 131, serialNo = 2, moduleName = 'workshop',
               UpdatedBy = 'Admin', UpdatedDate = GETDATE() WHERE id = 138;

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 142)
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        VALUES (142, 'Overview', 131, '/', 1, 'workshop', 'Admin', GETDATE());

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 143)
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        VALUES (143, 'Overview', 131, '/', 1, 'account', 'Admin', GETDATE());

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuMaster WHERE id = 144)
        INSERT INTO dbo.MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
        VALUES (144, 'Account Dashboard', 131, '/account-dashboard', 2, 'account', 'Admin', GETDATE());

    SET IDENTITY_INSERT dbo.MenuMaster OFF;

    -- an older Workshop Analytics row with another id: move its rights to 138, remove it
    IF @Old IS NOT NULL
    BEGIN
        UPDATE dbo.RoleWiseMenuRights SET SubMenuId = 138, MenuId = 131 WHERE SubMenuId = @Old
           AND RoleId NOT IN (SELECT RoleId FROM dbo.RoleWiseMenuRights WHERE SubMenuId = 138);
        DELETE FROM dbo.RoleWiseMenuRights WHERE SubMenuId = @Old;
        DELETE FROM dbo.MenuMaster WHERE id = @Old;
    END

    /* 3. rights: same roles + same permission as Overview (132) */
    INSERT INTO dbo.RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    SELECT r.RoleId, 131, n.SubMenuId, MAX(r.Permission), 'Admin', GETDATE()
    FROM dbo.RoleWiseMenuRights r
    CROSS JOIN (VALUES (138), (142), (143), (144)) n (SubMenuId)
    WHERE r.SubMenuId = 132
      AND NOT EXISTS (SELECT 1 FROM dbo.RoleWiseMenuRights x WHERE x.RoleId = r.RoleId AND x.SubMenuId = n.SubMenuId)
    GROUP BY r.RoleId, n.SubMenuId;

    /* keep the identity seed after the highest id */
    DECLARE @MaxId INT = (SELECT MAX(id) FROM dbo.MenuMaster);
    DBCC CHECKIDENT ('dbo.MenuMaster', RESEED, @MaxId) WITH NO_INFOMSGS;

COMMIT TRANSACTION;

/* check */
SELECT id, menuName, parentMenuId, pathName, serialNo, moduleName
FROM dbo.MenuMaster WHERE parentMenuId = 131 OR id = 131
ORDER BY moduleName, serialNo;

SELECT ro.Name AS RoleName, w.SubMenuId, m.menuName, m.moduleName, w.Permission
FROM dbo.RoleWiseMenuRights w
JOIN dbo.MenuMaster m ON m.id = w.SubMenuId
LEFT JOIN dbo.AspNetRoles ro ON ro.Id = w.RoleId
WHERE w.MenuId = 131
ORDER BY ro.Name, m.moduleName, m.serialNo;
-- Log out and log in again to reload the menu.
