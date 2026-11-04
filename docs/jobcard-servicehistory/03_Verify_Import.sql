/* =====================================================================================
   Jobcard Servicehistory import - checks before / after an import (read-only)
   Database : BAPLDMSvad
   Run step 5 BEFORE the import and again AFTER it - Job Card counts must not change.
   ===================================================================================== */
SET NOCOUNT ON;

-- 1. rows per import run
SELECT ImportBatchId, SourceFileName, ImportedBy, MIN(ImportedAtUtc) AS StartedUtc, MAX(ImportedAtUtc) AS EndedUtc,
       COUNT_BIG(*) AS RowsInserted, MIN(SourceRowNo) AS FirstExcelRow, MAX(SourceRowNo) AS LastExcelRow,
       MIN(JobDate) AS FromJobDate, MAX(JobDate) AS ToJobDate, SUM(NetTotal) AS NetTotal
FROM dbo.JobCardServiceHistory
GROUP BY ImportBatchId, SourceFileName, ImportedBy
ORDER BY StartedUtc;

-- 2. must return 0 rows: duplicate UniqueKeys (the unique index prevents them)
SELECT UniqueKey, COUNT(*) AS Cnt FROM dbo.JobCardServiceHistory GROUP BY UniqueKey HAVING COUNT(*) > 1;

-- 3. must return 0 rows: the same source row imported twice from one file
SELECT SourceFileName, SourceId, COUNT(*) AS Cnt FROM dbo.JobCardServiceHistory
WHERE SourceId IS NOT NULL GROUP BY SourceFileName, SourceId HAVING COUNT(*) > 1;

-- 4. tie-out with the validation result of Jobcard servicehistory.xlsx (03.11.2026):
--    TotalRows 481392 | Dealers 441 | NetTotal 220617715.19 | BlankChassis 4 | NullProformaDate 466652 | NullSaleDate 82334
SELECT COUNT_BIG(*) AS TotalRows, COUNT(DISTINCT DealerCode) AS Dealers, SUM(NetTotal) AS NetTotal,
       SUM(CASE WHEN ChassisNo IS NULL THEN 1 ELSE 0 END) AS BlankChassis,
       SUM(CASE WHEN ProformaDate IS NULL THEN 1 ELSE 0 END) AS NullProformaDate,
       SUM(CASE WHEN SaleDate IS NULL THEN 1 ELSE 0 END) AS NullSaleDate,
       MIN(JobDate) AS FromJobDate, MAX(JobDate) AS ToJobDate
FROM dbo.JobCardServiceHistory;

-- 5. Job Card tables must be unchanged by the import (run before and after, compare)
--    (Job Cards in BAPLDMSvad live in JobCardHeader; the DMS model has no dbo.JobCards table)
SELECT 'JobCardHeader' AS TableName, COUNT_BIG(*) AS RowsNow, MAX(Id) AS MaxId FROM dbo.JobCardHeader;

-- 6. space used by the new table
EXEC sp_spaceused N'dbo.JobCardServiceHistory';

/* 7. ROLLBACK of one import run (only if needed, and only with approval).
      Removes just the rows that run inserted; no other table is affected.
   DECLARE @ImportBatchId uniqueidentifier = '<ImportBatchId from step 1>';
   BEGIN TRAN;
     DELETE FROM dbo.JobCardServiceHistory WHERE ImportBatchId = @ImportBatchId;
     -- check @@ROWCOUNT = RowsInserted from step 1, then:
   COMMIT;   -- or ROLLBACK;
*/
