export interface productModel {
  _id?: any;
  image?: any;
  name?: any;
  category?: any;
  stock?: any;
  price?: any;
  orders?: any;
  rating?: any;
  publishedDate?: any;
  time?: any;
  status?: any;
}

// tslint:disable-next-line: class-name
export class arrayModel {
  key!: string;
  value!: string;
}

// tslint:disable-next-line: class-name
export class productListModel {
  id!: number;
  name!: string;
  category!: string;
  seller!: string;
  published!: string;
  ratings = 0;
  reviewCount = 0;
  price?: number;
  orders!: number;
  stocks!: number;
  revenue!: number;
  sizes?: arrayModel[];
  colors?: arrayModel[];
  description!: string;
  features!: string[];
  services!: string[];
  images!: string[];
  colorVariant!: arrayModel[];
  manufacture_name?: string;
  manufacture_brand?: string;
}

export interface OrdersModel {
  _id: any;
  orderId: string;
  customer: string;
  amount: string;
  orderDate: string;
  payment: string;
  product: string;
  status: string;
  isSelected?: any;
}

export interface customerModel {
  _id:any;
  customer: string;
  email: string;
  phone: string;
  date: string;
  status: string;
  statusClass: string;
  isSelected?:any;
}

export interface CartModel {
  image: string;
  name: string;
  color: string;
  size: string;
  price: string;
  quantity: number;
  total: string;
  id: string;
}

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexMarkers,
  ApexFill,
  ApexYAxis,
  ApexTooltip,
  ApexLegend,
  ApexAnnotations,
  ApexTheme
} from "ng-apexcharts";

export type ChartOptions = {
  series?: ApexAxisChartSeries | any;
  chart?: ApexChart;
  xaxis?: ApexXAxis;
  dataLabels?: ApexDataLabels;
  grid?: ApexGrid;
  stroke?: ApexStroke;
  title?: ApexTitleSubtitle;
  markers?: ApexMarkers;
  colors?: string[];
  fill?: ApexFill;
  yaxis?: ApexYAxis | ApexYAxis[];
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
  annotations?: ApexAnnotations;
  labels?: string[] | number[];
  toolbar?: any;
  subtitle?: ApexTitleSubtitle;
  plotOptions?: ApexPlotOptions;
  theme?: ApexTheme
};

export interface sellerModel {
  image: string;
  name: string;
  sellername: string;
  stock: string;
  ballence: string;
  category:string;
}
