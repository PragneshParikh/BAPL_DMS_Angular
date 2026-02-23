export interface ContactsModel {
    _id: any;
    profile: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    score: string;
    date: string;
    time: string;
    tags: Array<{}>;
    isSelected?: any;
}

export interface CompaniesModel {
    contact_email?: any;
    employee?: any;
    image_src?: any;
    industry_type?: any;
    location?: any;
    name?: any;
    owner?: any;
    since?: any;
    star_value?: any;
    website?: any;
    _id?: any;
}

export interface DealModel {
    id: any;
    bgColor: any;
    title: any;
    price: any;
    deals: any;
    subItems: [{
        id: any;
        isRibbon?: boolean,
        isOpen?: boolean,
        img?: any;
        title: any;
        price: any;
        date: any;
        subTitle: any;
        timeDuration: any;
        timeDurationClass: any;
        isFooter: any,
    }]
}

export interface LeadsModel {
    _id: any;
    profile: string;
    name: string;
    company: string;
    score: string;
    phone: string;
    location: string;
    date: string;
    tags: Array<{}>;
    isSelected?: any;
}
