/* Verify the 5-row Cogxim test import (tblSaleRegister2021-Cogxim, ImportRowId 1-5) */

-- 1. Headers (expect 5 bills: ATBG1, ATBG25, ATBG39, ATBG41, ATBG5 for CUS0005)
SELECT h.Id, h.SaleBillNo, h.SaleDate, h.DealerCode, h.Location, h.CustomerName, h.LedgerId,
       h.SaleType, h.Financier, h.CustomerType, h.BillType, h.TotalAmount, h.Status, h.BillFrom, h.CreatedDate
FROM [dbo].[VehicleSaleBillHeader] h
WHERE h.BillFrom = 'Cogxim Import'
  AND h.DealerCode = 'CUS0005'
  AND h.SaleBillNo IN ('ATBG1','ATBG25','ATBG39','ATBG41','ATBG5')
ORDER BY h.SaleDate;

-- 2. Details (expect 5 vehicles)
SELECT d.VehicleSaleBillId, h.SaleBillNo, d.ChassisNo, d.ItemCode, d.ModelName, d.Colour,
       d.ItemRate, d.PreGstDiscount, d.Sgstper, d.Sgstamnt, d.Cgstper, d.Cgstamnt, d.Igstamnt,
       d.RegAmount, d.InsuranceAmount, d.PostGstDisc, d.FameIi, d.FinalAmount,
       d.Battery, d.ControllerNo, d.Narration
FROM [dbo].[VehicleSaleBillDetails] d
JOIN [dbo].[VehicleSaleBillHeader] h ON h.Id = d.VehicleSaleBillId
WHERE h.BillFrom = 'Cogxim Import'
  AND h.DealerCode = 'CUS0005'
  AND h.SaleBillNo IN ('ATBG1','ATBG25','ATBG39','ATBG41','ATBG5')
ORDER BY h.SaleDate;

-- 3. Totals check (expected: 5 vehicles, FinalAmount total = 3,53,694.99 - see Reconciliation sheet)
SELECT COUNT(*) AS Vehicles, SUM(d.FinalAmount) AS FinalAmountTotal
FROM [dbo].[VehicleSaleBillDetails] d
JOIN [dbo].[VehicleSaleBillHeader] h ON h.Id = d.VehicleSaleBillId
WHERE h.BillFrom = 'Cogxim Import' AND h.DealerCode = 'CUS0005'
  AND h.SaleBillNo IN ('ATBG1','ATBG25','ATBG39','ATBG41','ATBG5');

/* 4. ROLLBACK of this test only (run only if you want to remove the 5 test bills)
BEGIN TRAN;
DELETE d FROM [dbo].[VehicleSaleBillDetails] d
JOIN [dbo].[VehicleSaleBillHeader] h ON h.Id = d.VehicleSaleBillId
WHERE h.BillFrom = 'Cogxim Import' AND h.DealerCode = 'CUS0005'
  AND h.SaleBillNo IN ('ATBG1','ATBG25','ATBG39','ATBG41','ATBG5');
DELETE FROM [dbo].[VehicleSaleBillHeader]
WHERE BillFrom = 'Cogxim Import' AND DealerCode = 'CUS0005'
  AND SaleBillNo IN ('ATBG1','ATBG25','ATBG39','ATBG41','ATBG5');
-- COMMIT;  -- or ROLLBACK;
*/
