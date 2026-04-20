export interface LotInspectionUpdate {
    header: Header;
    details: Detail[];
}

export interface Header {
    invoiceNo: string;
    invoiceDate: Date; // ISO string (yyyy-MM-dd)
    dealerCode: string;

    lotNo?: number;
    arrivalDate?: Date;   // ISO string (yyyy-MM-dd)
    arrivalTime?: string;

    lrNo?: string;
    lrDate?: Date; // ISO string (yyyy-MM-dd)

    truckNo?: string;
    transporterName?: string;

    driverName?: string;
    driverContact?: string;

    commonRemarks?: string;

    vehicleFasteningBracket?: string;
    plasticCover?: string;
    nameSupervisor?: string;
    locationName?: string;
    UpdatedBy?: string;
    UpdatedDate?: string; // ISO string (yyyy-MM-dd)
    IsLotInspected?: boolean;
}

export interface Detail {
    id: number;
    lotHeaderID: number;   // VERY IMPORTANT (for update)

    modelName?: string;
    chassisNo?: string; // VERY IMPORTANT (for update)
    motorNo?: string;
    batteryNo?: string;
    chargerNo?: string;

    keyFobSetQty?: number;
    chargerQty?: number;
    mirrorSetQty?: number;
    firstAidKitQty?: number;
    toolkitQty?: number;
    ownersManual?: number;
    ignitionKeySet?: number;
    inspectionDate?: Date; // ISO string (yyyy-MM-dd)
    vehicleStatus?: string;
    damageDetails?: string;
    chassisWiseRemarks?: string;
    chargingKit?:number;
    attributeCard?:number;
    modelWiseSupervisorName?: string;
    

    //lotVehicleDamageImage?: File; // file upload
    UpdatedBy?: string;
    UpdatedDate?: string; // ISO string (yyyy-MM-dd)
}