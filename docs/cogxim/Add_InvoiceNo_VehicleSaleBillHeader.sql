/* STEP 1 - run once on BAPLDMSvad BEFORE starting the updated API.
   Adds InvoiceNo (Cogxim / old DMS invoice no) to the sale bill header.
   SaleBillNo keeps the DMS number generated from Prefix Master ("sale_bill"). */
USE [BAPLDMSvad];
GO
IF COL_LENGTH('dbo.VehicleSaleBillHeader', 'InvoiceNo') IS NULL
    ALTER TABLE dbo.VehicleSaleBillHeader ADD InvoiceNo NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VehicleSaleBillHeader_Dealer_InvoiceNo'
               AND object_id = OBJECT_ID('dbo.VehicleSaleBillHeader'))
    CREATE INDEX IX_VehicleSaleBillHeader_Dealer_InvoiceNo ON dbo.VehicleSaleBillHeader (DealerCode, InvoiceNo);
GO

/* Check the active sale_bill prefixes of the Cogxim dealers (dealers without one get VSB/<last 3 digits>/<FY>/###) */
SELECT DealerCode, SequenceCode, BillingType, NextNo, Increment, [Year]
FROM dbo.NumberSequence
WHERE SequenceName = 'sale_bill' AND IsActive = 1
ORDER BY DealerCode, BillingType;

/* AFTER importing - the 5 test bills now carry a DMS Sale Bill No + Cogxim Invoice No */
SELECT SaleBillNo, InvoiceNo, SaleDate, Location, CustomerName
FROM dbo.VehicleSaleBillHeader
WHERE BillFrom = 'Cogxim Import' AND DealerCode = 'CUS0005'
  AND (InvoiceNo IN ('ATBG1','ATBG5','ATBG25','ATBG39','ATBG41') OR SaleBillNo IN ('ATBG1','ATBG5','ATBG25','ATBG39','ATBG41'))
ORDER BY SaleDate;

/* AFTER all 7 files - totals per financial year */
SELECT YEAR(h.SaleDate) - CASE WHEN MONTH(h.SaleDate) < 4 THEN 1 ELSE 0 END AS FYStart,
       COUNT(DISTINCT h.Id) AS Bills, COUNT(*) AS Vehicles, SUM(d.FinalAmount) AS FinalAmount
FROM dbo.VehicleSaleBillHeader h
JOIN dbo.VehicleSaleBillDetails d ON d.VehicleSaleBillId = h.Id
WHERE h.BillFrom = 'Cogxim Import' AND h.IsDeleted = 0
GROUP BY YEAR(h.SaleDate) - CASE WHEN MONTH(h.SaleDate) < 4 THEN 1 ELSE 0 END
ORDER BY 1;
