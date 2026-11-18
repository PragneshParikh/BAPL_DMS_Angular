/* =====================================================================================
   Jobcard Servicehistory import - destination table
   Database : BAPLDMSvad   (DMS database - the API's existing DefaultConnection)
   Creates  : dbo.JobCardServiceHistory  (+ unique index on UniqueKey + look-up indexes)
   Touches  : nothing else. JobCardHeader, dbo.JobCards (if present) and all Job Card tables are NOT changed.

   *** DO NOT RUN ON PRODUCTION WITHOUT APPROVAL ***

   Source   : Jobcard servicehistory.xlsx = export of DMS_IOT_DATA.dbo.DMS_ServiceHistory
              (63 columns, 4,81,392 rows, profiled 03.11.2026). Every Excel column has a column here;
              Excel "Id" (the source table's identity) is kept as SourceId because this table has its own Id.
   Types    : chosen from the full-file profile (max length found -> size with head-room;
              always-whole numbers -> int; amounts -> decimal(18,2)). Must match
              DMS_BAPL_Data/Services/JobCardServiceHistoryImportService/JcshColumns.cs.
   Key      : UniqueKey - NOT NULL, unique. File profile: 0 blank, 4,81,392 distinct, 0 duplicates
              (also 0 duplicates ignoring case / trailing spaces), max 40 characters.
   Storage  : DATA_COMPRESSION = PAGE (history data, insert-only; roughly halves nvarchar storage).

   Steps    : 1 checks  ->  2 create table (only if missing)  ->  3 validate existing data
              ->  4 unique index (only if step 3 is clean)  ->  5 look-up indexes  ->  6 report
   Safe to run again: creates only what is missing; never drops or alters existing objects.
   ===================================================================================== */
SET NOCOUNT ON;
SET XACT_ABORT ON;

/* ---------- 1. checks ---------- */
IF DB_NAME() <> N'BAPLDMSvad'
BEGIN
    RAISERROR('Run this script in the BAPLDMSvad database.', 16, 1);
    RETURN;
END

IF OBJECT_ID(N'dbo.JobCardServiceHistory', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.JobCardServiceHistory', N'UniqueKey') IS NULL
BEGIN
    RAISERROR('A table dbo.JobCardServiceHistory already exists with a different structure (no UniqueKey column). Nothing changed - check it before continuing.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

/* ---------- 2. table ---------- */
IF OBJECT_ID(N'dbo.JobCardServiceHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.JobCardServiceHistory
    (
        Id                    bigint IDENTITY(1,1) NOT NULL,

        -- ---------- Job ----------
        SourceId              int            NULL,      -- Excel "Id" (DMS_ServiceHistory.Id)
        DealerCode            nvarchar(20)   NOT NULL,  -- max 7 in file
        JobNo                 int            NOT NULL,  -- 0 .. 19,520 in file
        JobDate               date           NOT NULL,  -- 01.04.2020 .. 03.11.2026
        CompName              nvarchar(100)  NULL,      -- max 53
        Location              nvarchar(100)  NULL,      -- max 53
        InTime                nvarchar(10)   NULL,      -- text like '1:22AM' (max 7)
        CloseTime             nvarchar(10)   NULL,
        JobCategory           nvarchar(50)   NULL,      -- max 17
        FFRPercentage         int            NULL,      -- 0 .. 100, always whole
        DocNo                 int            NULL,      -- 0 .. 17,750
        DocType               nvarchar(30)   NULL,      -- max 17
        DocDate               date           NULL,
        Supervisor            nvarchar(100)  NULL,      -- max 29
        Technician            nvarchar(100)  NULL,      -- max 27
        ServiceHead           nvarchar(50)   NULL,      -- max 18
        JobType               nvarchar(100)  NULL,      -- max 42
        CouponNo              nvarchar(100)  NULL,      -- max 55
        ExpectedDeliveryDate  date           NULL,
        ProformaDate          date           NULL,
        InvoiceDate           date           NULL,
        Status                nvarchar(50)   NULL,      -- "NULL" in every row of this file
        RepairType            nvarchar(50)   NULL,      -- "NULL" in every row of this file
        CompletionDate        date           NULL,      -- "NULL" in every row of this file
        JobStatus             nvarchar(20)   NULL,      -- Open / Closed (stored as-is, not computed)

        -- ---------- Vehicle ----------
        Model                 nvarchar(100)  NULL,      -- max 43
        BrandName             nvarchar(100)  NULL,      -- max 36
        RegNo                 nvarchar(30)   NULL,      -- max 21 (some numeric cells -> stored as text)
        VehicleType           nvarchar(20)   NULL,      -- Internal / External
        EngineNo              nvarchar(30)   NULL,      -- max 17
        ChassisNo             nvarchar(30)   NULL,      -- max 21 (4 blank rows)
        KMS                   decimal(14,2)  NULL,      -- up to 9,24,44,11,114 with 2 decimals in file
        SaleDate              date           NULL,

        -- ---------- Battery ----------
        BatterySerialNo1      nvarchar(30)   NULL,      -- max 20
        BatterySerialNo2      nvarchar(30)   NULL,
        BatterySerialNo3      nvarchar(30)   NULL,
        BatterySerialNo4      nvarchar(30)   NULL,
        BatterySerialNo5      nvarchar(30)   NULL,
        BatterySerialNo6      nvarchar(30)   NULL,
        IndividualAHBattery1  nvarchar(30)   NULL,      -- mixed text / numbers in file -> text
        IndividualAHBattery2  nvarchar(30)   NULL,
        IndividualAHBattery3  nvarchar(30)   NULL,
        IndividualAHBattery4  nvarchar(30)   NULL,
        IndividualAHBattery5  nvarchar(30)   NULL,
        IndividualAHBattery6  nvarchar(30)   NULL,

        -- ---------- Customer (personal data - confidential) ----------
        PartyName             nvarchar(200)  NULL,      -- max 118
        MobileNumber          nvarchar(20)   NULL,      -- 10 digits; stored as text

        -- ---------- Amounts (INR) ----------
        EstimatedJobExpenses  decimal(18,2)  NULL,
        LabourHours           decimal(9,2)   NULL,      -- max 352
        Parts                 decimal(18,2)  NULL,
        Accessory             decimal(18,2)  NULL,
        Oil                   decimal(18,2)  NULL,
        Labour                decimal(18,2)  NULL,
        OutsideWork           decimal(18,2)  NULL,
        TotalWOTax            decimal(18,2)  NULL,      -- max 16,90,350
        GSTAmount             decimal(18,2)  NULL,      -- min -45 (negative kept)
        IGSTAmount            decimal(18,2)  NULL,
        NetTotal              decimal(18,2)  NULL,      -- max 19,94,620
        IsRowTotal            bit            NULL,

        -- ---------- Source record ----------
        CreatedAt             datetime2(3)   NULL,      -- source table timestamps, kept as-is
        UpdatedAt             datetime2(3)   NULL,
        RowHash               nvarchar(100)  NULL,      -- "NULL" in every row of this file
        UniqueKey             nvarchar(100)  NOT NULL,  -- max 40; = DealerCode+JobNo+JobDate+ChassisNo in the source

        -- ---------- Import audit ----------
        ImportBatchId         uniqueidentifier NOT NULL,                 -- one per import run (rollback key)
        ImportedAtUtc         datetime2(3)   NOT NULL CONSTRAINT DF_JobCardServiceHistory_ImportedAtUtc DEFAULT (SYSUTCDATETIME()),
        ImportedBy            nvarchar(100)  NOT NULL,                   -- DMS user id
        SourceFileName        nvarchar(260)  NOT NULL,
        SourceRowNo           int            NOT NULL,                   -- Excel row number

        CONSTRAINT PK_JobCardServiceHistory PRIMARY KEY CLUSTERED (Id) WITH (DATA_COMPRESSION = PAGE)
    );
    PRINT 'Created dbo.JobCardServiceHistory';
END
ELSE
    PRINT 'dbo.JobCardServiceHistory already exists - structure not changed';

/* ---------- 3. validate existing data before the unique index ---------- */
DECLARE @Rows BIGINT, @BlankKeys BIGINT, @DupKeys BIGINT;
SELECT @Rows = COUNT_BIG(*),
       @BlankKeys = SUM(CASE WHEN UniqueKey IS NULL OR LTRIM(RTRIM(UniqueKey)) = N'' THEN 1 ELSE 0 END)
FROM dbo.JobCardServiceHistory;
SELECT @DupKeys = COUNT_BIG(*) FROM (SELECT UniqueKey FROM dbo.JobCardServiceHistory GROUP BY UniqueKey HAVING COUNT(*) > 1) d;
PRINT CONCAT('Existing rows: ', @Rows, ' | blank UniqueKey: ', ISNULL(@BlankKeys, 0), ' | duplicate UniqueKey values: ', @DupKeys);

IF ISNULL(@BlankKeys, 0) > 0 OR @DupKeys > 0
BEGIN
    ROLLBACK TRANSACTION;
    SELECT TOP (100) UniqueKey, COUNT(*) AS Cnt FROM dbo.JobCardServiceHistory GROUP BY UniqueKey HAVING COUNT(*) > 1 ORDER BY Cnt DESC;
    RAISERROR('Existing rows have blank or duplicate UniqueKey - unique index NOT created, nothing changed. Clean the data first.', 16, 1);
    RETURN;
END

/* ---------- 4. duplicate guard: one row per UniqueKey ---------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name = N'UX_JobCardServiceHistory_UniqueKey')
    CREATE UNIQUE NONCLUSTERED INDEX UX_JobCardServiceHistory_UniqueKey ON dbo.JobCardServiceHistory (UniqueKey) WITH (DATA_COMPRESSION = PAGE);

/* ---------- 5. look-up indexes (read API / reports) ---------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name = N'IX_JobCardServiceHistory_ChassisNo')
    CREATE NONCLUSTERED INDEX IX_JobCardServiceHistory_ChassisNo ON dbo.JobCardServiceHistory (ChassisNo, JobDate DESC) WITH (DATA_COMPRESSION = PAGE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name = N'IX_JobCardServiceHistory_RegNo')
    CREATE NONCLUSTERED INDEX IX_JobCardServiceHistory_RegNo ON dbo.JobCardServiceHistory (RegNo, JobDate DESC) WITH (DATA_COMPRESSION = PAGE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name = N'IX_JobCardServiceHistory_Dealer_JobDate')
    CREATE NONCLUSTERED INDEX IX_JobCardServiceHistory_Dealer_JobDate ON dbo.JobCardServiceHistory (DealerCode, JobDate DESC) WITH (DATA_COMPRESSION = PAGE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name = N'IX_JobCardServiceHistory_ImportBatchId')
    CREATE NONCLUSTERED INDEX IX_JobCardServiceHistory_ImportBatchId ON dbo.JobCardServiceHistory (ImportBatchId) WITH (DATA_COMPRESSION = PAGE);

COMMIT TRANSACTION;

/* ---------- 6. report ---------- */
SELECT c.column_id, c.name, TYPE_NAME(c.user_type_id) AS type,
       CASE WHEN TYPE_NAME(c.user_type_id) LIKE 'n%char' THEN c.max_length / 2 ELSE c.max_length END AS length,
       c.precision, c.scale, c.is_nullable
FROM sys.columns c WHERE c.object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') ORDER BY c.column_id;   -- expect 69 columns
SELECT name, is_unique, type_desc FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JobCardServiceHistory') AND name IS NOT NULL;
