/* =====================================================================
   BGAUSS DMS - menus for new pages (run once; safe to re-run)
     137 = Vehicle Sale Import  (Utility, workshop)   -> route 'vehicle-sale-import'  data:[137]
     138 = Workshop Analytics   (Dashboard)           -> route 'workshop-analytics'   data:[138]
   The ids are fixed so they match app.routes.ts. If a row already exists
   with another id it is moved to the fixed id (rights moved with it).
   ===================================================================== */
SET XACT_ABORT ON;
BEGIN TRAN;

DECLARE @SuperAdmin NVARCHAR(450) = '05db0890-3bc0-4519-bb38-b02ac61dcafe';
DECLARE @OldId INT;

/* ---------- 1. Vehicle Sale Import  -> id 137 ---------- */
SELECT @OldId = id FROM MenuMaster WHERE pathName = '/vehicle-sale-import';

IF @OldId IS NULL OR @OldId <> 137
BEGIN
    IF EXISTS (SELECT 1 FROM MenuMaster WHERE id = 137 AND ISNULL(pathName,'') <> '/vehicle-sale-import')
        THROW 50001, 'MenuMaster id 137 is used by another menu. Stop and check before running.', 1;

    SET IDENTITY_INSERT MenuMaster ON;
    INSERT INTO MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
    VALUES (137, 'Vehicle Sale Import', 32, '/vehicle-sale-import', 5, 'workshop', 'admin', GETDATE());
    SET IDENTITY_INSERT MenuMaster OFF;

    IF @OldId IS NOT NULL      -- created earlier with an auto id: move its rights, remove old row
    BEGIN
        UPDATE RoleWiseMenuRights SET SubMenuId = 137 WHERE SubMenuId = @OldId;
        DELETE FROM MenuMaster WHERE id = @OldId;
    END
END

IF NOT EXISTS (SELECT 1 FROM RoleWiseMenuRights WHERE RoleId = @SuperAdmin AND SubMenuId = 137)
    INSERT INTO RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
    VALUES (@SuperAdmin, 32, 137, 31, 'admin', GETDATE());

/* ---------- 2. Workshop Analytics -> id 138 (under Dashboard 131) ---------- */
SET @OldId = NULL;
SELECT @OldId = id FROM MenuMaster WHERE pathName = '/workshop-analytics';

IF @OldId IS NULL OR @OldId <> 138
BEGIN
    IF EXISTS (SELECT 1 FROM MenuMaster WHERE id = 138 AND ISNULL(pathName,'') <> '/workshop-analytics')
        THROW 50002, 'MenuMaster id 138 is used by another menu. Stop and check before running.', 1;

    SET IDENTITY_INSERT MenuMaster ON;
    INSERT INTO MenuMaster (id, menuName, parentMenuId, pathName, serialNo, moduleName, CreatedBy, CreatedDate)
    VALUES (138, 'Workshop Analytics', 131, '/workshop-analytics', 5, NULL, 'admin', GETDATE());
    SET IDENTITY_INSERT MenuMaster OFF;

    IF @OldId IS NOT NULL
    BEGIN
        UPDATE RoleWiseMenuRights SET SubMenuId = 138 WHERE SubMenuId = @OldId;
        DELETE FROM MenuMaster WHERE id = @OldId;
    END
END

-- Same roles that see "Overview" (132) get Workshop Analytics, View only (1)
INSERT INTO RoleWiseMenuRights (RoleId, MenuId, SubMenuId, Permission, CreatedBy, CreatedDate)
SELECT DISTINCT r.RoleId, 131, 138, 1, 'admin', GETDATE()
FROM RoleWiseMenuRights r
WHERE r.SubMenuId = 132
  AND NOT EXISTS (SELECT 1 FROM RoleWiseMenuRights x WHERE x.RoleId = r.RoleId AND x.SubMenuId = 138);

/* keep the identity seed after the highest id */
DECLARE @MaxId INT = (SELECT MAX(id) FROM MenuMaster);
DBCC CHECKIDENT ('MenuMaster', RESEED, @MaxId);

COMMIT;

/* ---------- 3. Check ---------- */
SELECT m.id, m.menuName, m.parentMenuId, m.pathName, m.serialNo, m.moduleName,
       COUNT(r.Id) AS RolesWithRights
FROM MenuMaster m
LEFT JOIN RoleWiseMenuRights r ON r.SubMenuId = m.id
WHERE m.id IN (137, 138)
GROUP BY m.id, m.menuName, m.parentMenuId, m.pathName, m.serialNo, m.moduleName;
