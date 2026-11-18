/* =====================================================================================
   Vehicle Sale Import (Cogxim) - indexes for the import look-ups
   Database : BAPLDMSvad (Azure SQL)
   Why      : "Import failed: The wait operation timed out" - the import checks every chassis / invoice /
              customer of the file against the database in groups of 1,000. Without these indexes each
              group scans the whole table (the DMS model shows only the primary key on
              VehicleSaleBillDetails and only SaleBillNo on VehicleSaleBillHeader).

   *** DO NOT RUN ON PRODUCTION WITHOUT APPROVAL ***
   Adds indexes only - no data, column or table is changed. ONLINE = ON: the tables stay usable
   while the index is built. An index is skipped when one already starts with the same column(s).
   Run step 0 first to see what exists today.
   ===================================================================================== */
SET NOCOUNT ON;

IF DB_NAME() <> N'BAPLDMSvad'
BEGIN
    RAISERROR('Run this script in the BAPLDMSvad database.', 16, 1);
    RETURN;
END

/* ---------- 0. existing indexes + row counts (read-only) ---------- */
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS KeyColumns
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id IN (OBJECT_ID(N'dbo.VehicleSaleBillDetails'), OBJECT_ID(N'dbo.VehicleSaleBillHeader'), OBJECT_ID(N'dbo.LedgerMaster'))
GROUP BY i.object_id, i.name, i.type_desc
ORDER BY TableName, IndexName;

SELECT 'VehicleSaleBillDetails' AS TableName, COUNT_BIG(*) AS RowsNow FROM dbo.VehicleSaleBillDetails
UNION ALL SELECT 'VehicleSaleBillHeader', COUNT_BIG(*) FROM dbo.VehicleSaleBillHeader
UNION ALL SELECT 'LedgerMaster', COUNT_BIG(*) FROM dbo.LedgerMaster;

/* helper: does an index already start with these key columns? */
DECLARE @t TABLE (TableName sysname, LeadCols nvarchar(400));
INSERT INTO @t
SELECT OBJECT_NAME(i.object_id),
       STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY ic.key_ordinal)
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0 AND ic.key_ordinal <= 2
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id IN (OBJECT_ID(N'dbo.VehicleSaleBillDetails'), OBJECT_ID(N'dbo.VehicleSaleBillHeader'), OBJECT_ID(N'dbo.LedgerMaster'))
GROUP BY i.object_id, i.index_id;

/* ---------- 1. chassis already billed?  (WHERE ChassisNo IN (…) JOIN header) ---------- */
IF NOT EXISTS (SELECT 1 FROM @t WHERE TableName = N'VehicleSaleBillDetails' AND (LeadCols = N'ChassisNo' OR LeadCols LIKE N'ChassisNo,%'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_VehicleSaleBillDetails_ChassisNo
        ON dbo.VehicleSaleBillDetails (ChassisNo) INCLUDE (VehicleSaleBillId) WITH (ONLINE = ON);
    PRINT 'Created IX_VehicleSaleBillDetails_ChassisNo';
END
ELSE PRINT 'Skipped: VehicleSaleBillDetails already has an index on ChassisNo';

/* ---------- 2. details of a bill (foreign key - used by the import's bill updates and the Sale Bill screens) ---------- */
IF NOT EXISTS (SELECT 1 FROM @t WHERE TableName = N'VehicleSaleBillDetails' AND (LeadCols = N'VehicleSaleBillId' OR LeadCols LIKE N'VehicleSaleBillId,%'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_VehicleSaleBillDetails_VehicleSaleBillId
        ON dbo.VehicleSaleBillDetails (VehicleSaleBillId) WITH (ONLINE = ON);
    PRINT 'Created IX_VehicleSaleBillDetails_VehicleSaleBillId';
END
ELSE PRINT 'Skipped: VehicleSaleBillDetails already has an index on VehicleSaleBillId';

/* ---------- 3. bills imported earlier from Cogxim  (InvoiceNo IN (…) for the file's dealers) ----------
   docs/cogxim/Add_InvoiceNo_VehicleSaleBillHeader.sql may already have created (DealerCode, InvoiceNo) - then skipped. */
IF NOT EXISTS (SELECT 1 FROM @t WHERE TableName = N'VehicleSaleBillHeader' AND LeadCols IN (N'DealerCode,InvoiceNo', N'InvoiceNo', N'InvoiceNo,DealerCode'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_VehicleSaleBillHeader_Dealer_InvoiceNo
        ON dbo.VehicleSaleBillHeader (DealerCode, InvoiceNo) INCLUDE (BillFrom, SaleDate, IsDeleted, LedgerId) WITH (ONLINE = ON);
    PRINT 'Created IX_VehicleSaleBillHeader_Dealer_InvoiceNo';
END
ELSE PRINT 'Skipped: VehicleSaleBillHeader already has a (DealerCode, InvoiceNo) index';

/* ---------- 4. customers of the file's dealers  (DealerCode IN (…) AND LedgerType IN ('Party','Institutional')) ---------- */
IF NOT EXISTS (SELECT 1 FROM @t WHERE TableName = N'LedgerMaster' AND (LeadCols = N'DealerCode' OR LeadCols LIKE N'DealerCode,%'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_LedgerMaster_DealerCode_LedgerType
        ON dbo.LedgerMaster (DealerCode, LedgerType) INCLUDE (LedgerName, MobileNumber, LedgerCode) WITH (ONLINE = ON);
    PRINT 'Created IX_LedgerMaster_DealerCode_LedgerType';
END
ELSE PRINT 'Skipped: LedgerMaster already has an index on DealerCode';

/* ---------- 5. check ---------- */
SELECT OBJECT_NAME(object_id) AS TableName, name AS IndexName
FROM sys.indexes
WHERE name IN (N'IX_VehicleSaleBillDetails_ChassisNo', N'IX_VehicleSaleBillDetails_VehicleSaleBillId',
               N'IX_VehicleSaleBillHeader_Dealer_InvoiceNo', N'IX_LedgerMaster_DealerCode_LedgerType');

/* Rollback (only if ever needed):
   DROP INDEX IX_VehicleSaleBillDetails_ChassisNo          ON dbo.VehicleSaleBillDetails;
   DROP INDEX IX_VehicleSaleBillDetails_VehicleSaleBillId  ON dbo.VehicleSaleBillDetails;
   DROP INDEX IX_LedgerMaster_DealerCode_LedgerType        ON dbo.LedgerMaster;
   (IX_VehicleSaleBillHeader_Dealer_InvoiceNo may come from the earlier InvoiceNo script - keep it) */
