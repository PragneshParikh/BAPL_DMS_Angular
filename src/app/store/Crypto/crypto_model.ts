export interface MarketModel {
    img: string;
    coinName: string;
    price: string;
    pairs: string;
    high: string;
    low: string;
    marketVolume: string;
    percentage: string;
    icon: string;
    iconClass: string;
}

export interface ICOModel {
    img?: string;
    label?: any;
    caption?: any;
    amount?: string;
    percentage?: string;
    rating?: string;
    date?: string;
    dateClass?: string;
    ribbonNumber?: string;
    status?: string;
}
  
export interface WalletModel {
    img?: any;
    coinName?: any;
    quantity?: any;
    avgPrice?: any;
    value?: any;
    returns?: any;
    icon?: any;
    percentage?: any;
    percentageClass?: any;
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
    yaxis?: ApexYAxis | ApexYAxis[];
    xaxis?: ApexXAxis;
    dataLabels?: ApexDataLabels;
    markers?: ApexMarkers;
    tooltip?: ApexTooltip;
    fill?: ApexFill;
    grid?: ApexGrid;
    stroke?: ApexStroke;
    title?: ApexTitleSubtitle;
    colors?: string[];
    legend?: ApexLegend;
    annotations?: ApexAnnotations;
    labels?: string[] | number[];
    toolbar?: any;
    subtitle?: ApexTitleSubtitle;
    plotOptions?: ApexPlotOptions;
    theme?: ApexTheme
};
  
export interface OrdersModel {
    date: string;
    time: string;
    img: string;
    coinName: string;
    type: any;
    typeClass: string;
    quantity: string;
    orderValue: string;
    avgPrice: string;
    price: string;
    status: string;
    statusClass: string;
}
  
export interface TransactionsModel {
    icon: string;
    bg_color: string;
    date: string;
    time: string;
    image: string;
    currency: string;
    from: string;
    to?:any;
    details: string;
    id: string;
    type: string;
    amount: string;
    amount1: string;
    status: string;
    status_color: string;
    isSelected?:any;
  }
  
  
  
  
