/* =====================================================================================
   B2C job card Photos tab - BAPLDMSvad (25.11.2026)
   New table dbo.JobCardPhoto: one row per photo, linked to dbo.JobCardHeader(Id).
   The image file is stored by the DMS API under wwwroot/uploads/jobcard-photos/b2c-{JobCardHeader.Id}/
   (same layout JobCardScanner uses); only its URL is stored here. B2B photos use JobCardScanner's existing dbo.JobCardPhotos.
   Safe to run more than once. Changes nothing in existing tables.
   ===================================================================================== */
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.JobCardPhoto', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.JobCardPhoto
    (
        Id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_JobCardPhoto PRIMARY KEY,
        JobCardHeaderId  INT              NOT NULL,
        DealerCode       NVARCHAR(50)     NULL,
        Stage            NVARCHAR(20)     NOT NULL CONSTRAINT DF_JobCardPhoto_Stage DEFAULT (N'CheckIn'),
        FileName         NVARCHAR(260)    NOT NULL,
        BlobUrl          NVARCHAR(1000)   NOT NULL,
        ContentType      NVARCHAR(100)    NULL,
        FileSize         BIGINT           NULL,
        Caption          NVARCHAR(200)    NULL,
        IsDeleted        BIT              NOT NULL CONSTRAINT DF_JobCardPhoto_IsDeleted DEFAULT (0),
        CreatedBy        NVARCHAR(100)    NULL,
        CreatedDate      DATETIME2(3)     NOT NULL CONSTRAINT DF_JobCardPhoto_CreatedDate DEFAULT (SYSUTCDATETIME()),
        DeletedBy        NVARCHAR(100)    NULL,
        DeletedDate      DATETIME2(3)     NULL,
        CONSTRAINT FK_JobCardPhoto_JobCardHeader FOREIGN KEY (JobCardHeaderId) REFERENCES dbo.JobCardHeader (Id)
    );

    CREATE INDEX IX_JobCardPhoto_JobCardHeaderId ON dbo.JobCardPhoto (JobCardHeaderId) WHERE IsDeleted = 0;
    PRINT 'dbo.JobCardPhoto created.';
END
ELSE
    PRINT 'dbo.JobCardPhoto already exists - nothing changed.';

-- check
SELECT TOP 20 * FROM dbo.JobCardPhoto ORDER BY Id DESC;

-- photos of one job card:
-- SELECT * FROM dbo.JobCardPhoto WHERE JobCardHeaderId = <JobCardHeader.Id> AND IsDeleted = 0;
