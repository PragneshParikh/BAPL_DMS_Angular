import { ChartOptions } from "../../store/Crypto/crypto_model";

/**
 * Best Selling
 */
 const BestSelling = [
  {
      image: "assets/images/products/img-1.png",
      pName: 'Branded T-Shirts',
      date: '24 Apr 2021',
      price: '29.00',
      orders: '62',
      stock: '510',
      amount: '1,798',
  },
  {
    image: "assets/images/products/img-2.png",
    pName: 'Bentwood Chair',
    date: '19 Mar 2021',
    price: '85.20',
    orders: '35',
    stock: 'Out of stock',
    amount: '2982',
  },
  {
    image: "assets/images/products/img-3.png",
    pName: 'Borosil Paper Cup',
    date: '01 Mar 2021',
    price: '14.00',
    orders: '80',
    stock: '749',
    amount: '1120',
  },
  {
    image: "assets/images/products/img-4.png",
    pName: 'One Seater Sofa',
    date: '11 Feb 2021',
    price: '127.50',
    orders: '56',
    stock: 'Out of stock',
    amount: '7140',
  },
  {
    image: "assets/images/products/img-5.png",
    pName: 'Stillbird Helmet',
    date: '17 Jan 2021',
    price: '54',
    orders: '74',
    stock: '805',
    amount: '3996',
  }
];

/**
 * Top Selleing
 */
 const TopSelling = [
    {
        image: "assets/images/companies/img-1.png",
        pName: 'iTest Factory',
        subtitle: 'Oliver Tyler',
        type: 'Bags and Wallets',
        stock: '8547',
        amount: '541200',
        percentage: '32',
    },
    {
      image: "assets/images/companies/img-2.png",
      pName: 'Digitech Galaxy',
      subtitle: 'John Roberts',
      type: 'Watches',
      stock: '895',
      amount: '75030',
      percentage: '79',
    },
    {
      image: "assets/images/companies/img-3.png",
      pName: 'Nesta Technologies',
      subtitle: 'Harley Fuller',
      type: 'Bike Accessories',
      stock: '3470',
      amount: '45600',
      percentage: '90',
    },
    {
      image: "assets/images/companies/img-4.png",
      pName: 'Zoetic Fashion',
      subtitle: 'James Bowen',
      type: 'Clothes',
      stock: '5488',
      amount: '29456',
      percentage: '40',
    },
    {
      image: "assets/images/companies/img-5.png",
      pName: 'Meta4Systems',
      subtitle: 'Zoe Dennis',
      type: 'Furniture',
      stock: '4100',
      amount: '11260',
      percentage: '57',
    }
];

/**
 * Recent Selleing
 */
 const Recentelling = [
    {
        id: "#VZ2112",
        image: "assets/images/users/avatar-1.jpg",
        customer: 'Alex Smith',
        product: 'Clothes',
        amount: '109.00',
        vendor: 'Zoetic Fashion',
        status: 'Paid',
        rating: '5.0',
        average: "61"
    },
    {
        id: "#VZ2111",
        image: "assets/images/users/avatar-2.jpg",
        customer: 'Jansh Brown',
        product: 'Kitchen Storage',
        amount: '149.00',
        vendor: 'Micro Design',
        status: 'Pending',
        rating: '4.5',
        average: "61"
    },
    {
        id: "#VZ2109",
        image: "assets/images/users/avatar-3.jpg",
        customer: 'Ayaan Bowen',
        product: 'Bike Accessories',
        amount: '215.00',
        vendor: 'Nesta Technologies',
        status: 'Paid',
        rating: '4.9',
        average: "89"
    },    
    {
        id: "#VZ2108",
        image: "assets/images/users/avatar-4.jpg",
        customer: 'Prezy Mark',
        product: 'Furniture',
        amount: '199.00',
        vendor: 'Syntyce Solutions',
        status: 'Unpaid',
        rating: '4.3',
        average: "47"
    },   
    {
        id: "#VZ2107",
        image: "assets/images/users/avatar-6.jpg",
        customer: 'Vihan Hudda',
        product: 'Bags and Wallets',
        amount: '330.00',
        vendor: 'iTest Factory',
        status: 'Paid',
        rating: '4.7',
        average: "161"
    } 
];

/**
 * Stat Counder Data
 */
const statData = [{
      title: 'TOTAL EARNINGS',
      value: 559.25,
      icon: 'bx-dollar-circle',
      persantage: '16.24',
      profit: 'up',
      link:'View net earnings'
    }, {
        title: 'ORDERS',
        value: 36894,
        icon: 'bx-shopping-bag',
        persantage: '3.57',
        profit: 'down',
        link:'View all orders'
    }, {
        title: 'CUSTOMERS',
        value: 183.35,
        icon: 'bx-user-circle',
        persantage: '29.08',
        profit: 'up',
        link:'See details'
    }, {
        title: 'MY BALANCE',
        value: 165.89,
        icon: 'bx-wallet',
        persantage: '0.00',
        profit: 'equal',
        link:'Withdraw money'
    }
];
  


/**
 * Stat Counder Data
 */
 const cryptostatData = [{
    title: 'TOTAL INVESTED',
    value: 2390.68,
    icon: 'ri-money-dollar-circle-fill',
    persantage: '6.24',
    profit: 'up'
  }, {
    title: 'TOTAL CHANGE',
    value: 19523.25,
    icon: 'ri-arrow-up-circle-fill',
    persantage: '3.67',
    profit: 'up'
  }, {
    title: 'DAY CHANGE',
    value: 14799.44,
    icon: 'ri-arrow-down-circle-fill',
    persantage: '4.80',
    profit: 'down'
  }
];

/**
 * BitCoin Chart
 */
 const cryptoBitcoinChart: ChartOptions = {
  series: [{
    name: "Bitcoin",
    data: [85, 68, 35, 90, 8, 11, 26, 54]
  }, ],
  chart: {
    width: 130,
    height: 50,
    type: "area",
    sparkline: {
        enabled: true,
    },
    toolbar: {
        show: false,
    }
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
    width: 1.5,
  },
  fill: {
    type: "gradient",
    gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [50, 100, 100, 100],
    },
  },
  colors: ["#0ab39c"]
};

/**
 * Lite Coin Chart
 */
 const cryptolitecoinChart: ChartOptions = {
  series: [{
    name: "Litecoin",
    data: [25, 50, 41, 87, 12, 36, 9, 54]
  }, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#0ab39c"]
};

/**
 * Eatherreum Chart
 */
 const cryptoEatherreumChart: ChartOptions = {
  series: [{
    name: "Ethereum",
    data: [36, 21, 65, 22, 35, 50, 29, 44]
  }, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#0ab39c"]
};

/**
 * Binance Chart
 */
 const cryptoBinanceChart: ChartOptions = {
  series: [{
    name: "Binance",
    data: [30, 58, 29, 89, 12, 36, 9, 54]
  }, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#f06548"]
};

/**
 * Dash Chart
 */
 const cryptoDashChart: ChartOptions = {
  series: [{
    name: "Dash",
    data: [24, 68, 39, 86, 29, 42, 11, 58]
}, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#0ab39c"]
};

/**
 * Tether Chart
 */
 const cryptoTetherChart: ChartOptions = {
  series: [{
    name: "Dash",
    data: [13, 76, 12, 85, 25, 60, 9, 54]
  }, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#0ab39c"]
};

/**
 * NEO Chart
 */
 const cryptoNeoChart: ChartOptions = {
  series: [{
    name: "Neo",
    data: [9, 66, 41, 89, 12, 36, 25, 54]
  }, ],
  chart: {
      width: 130,
      height: 46,
      type: "area",
      sparkline: {
          enabled: true,
      },
      toolbar: {
          show: false,
      },
  },
  dataLabels: {
      enabled: false,
  },
  stroke: {
      curve: "smooth",
      width: 1.5,
  },
  fill: {
      type: "gradient",
      gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100, 100],
      },
  },
  colors: ["#f06548"]
};

/**
 * New Currencies
 */
 const cryptoCurrencies = [
  {
    image: "assets/images/svg/crypto-icons/btc.svg",
    coinName: "Bitcoin",
    price: '48,568.025',
    change: '5.26',
    profit: 'up',
    balance: '53,914.025',
    coin: '1.25634801',
  },
  {
    image: "assets/images/svg/crypto-icons/ltc.svg",
    coinName: "Litecoin",
    price: '87,142.027',
    change: '3.07',
    profit: 'down',
    balance: '75,854.127',
    coin: '2.85472161',
  },
  {
    image: "assets/images/svg/crypto-icons/eth.svg",
    coinName: "Ethereum",
    price: '33,847.961',
    change: '7.13',
    profit: 'up',
    balance: '44,152.185',
    coin: '1.45612347',
  },
  {
    image: "assets/images/svg/crypto-icons/bnb.svg",
    coinName: "Binance",
    price: '73,654.421',
    change: '0.97',
    profit: 'up',
    balance: '48,367.125',
    coin: '0.35734601',
  },
  {
    image: "assets/images/svg/crypto-icons/usdt.svg",
    coinName: "Tether",
    price: '66,742.077',
    change: '1.08',
    profit: 'down',
    balance: '53,487.083',
    coin: '3.62912570',
  },
  {
    image: "assets/images/svg/crypto-icons/dash.svg",
    coinName: "Dash",
    price: '34,736.209',
    change: '4.52',
    profit: 'up',
    balance: '15,203.347',
    coin: '1.85412740',
  },
  {
    image: "assets/images/svg/crypto-icons/neo.svg",
    coinName: "Neo",
    price: '56,357.313',
    change: '2.87',
    profit: 'down',
    balance: '61,843.173',
    coin: '1.87732061',
  },
  {
    image: "assets/images/svg/crypto-icons/doge.svg",
    coinName: "Dogecoin",
    price: '62,357.649',
    change: '3.45',
    profit: 'up',
    balance: '54,843.173',
    coin: '0.95632087',
  }
];

/**
 * Top Performers
 */
 const cryptoTopPerformers = [
  {
    image: "assets/images/svg/crypto-icons/btc.svg",
    coinName: "Bitcoin",
    price: '18.7',
    change: '12,863.08',
    profit: 'up',
    balance: '67.21',
    percentage: '4.33',
  },
  {
    image: "assets/images/svg/crypto-icons/eth.svg",
    coinName: "Ethereum",
    price: '27.4',
    change: '08,256.04',
    profit: 'up',
    balance: '51.19',
    percentage: '5.64',
  },
  {
    image: "assets/images/svg/crypto-icons/aave.svg",
    coinName: "Avalanche",
    price: '12.9',
    change: '11,896.13',
    profit: 'down',
    balance: '59.01',
    percentage: '4.08',
  },
  {
    image: "assets/images/svg/crypto-icons/doge.svg",
    coinName: "Dogecoin",
    price: '09.5',
    change: '15,999.06',
    profit: 'up',
    balance: '74.05',
    percentage: '3.12',
  },
  {
    image: "assets/images/svg/crypto-icons/bnb.svg",
    coinName: "Binance",
    price: '14.2',
    change: '13,786.18',
    profit: 'down',
    balance: '61.05',
    percentage: '9.22',
  },
  {
    image: "assets/images/svg/crypto-icons/ltc.svg",
    coinName: "Litecoin",
    price: '09.5',
    change: '10,604.27',
    profit: 'up',
    balance: '76.12',
    percentage: '4.92',
  }
];

/**
 * News Feed
 */
 const cryptoNewsFeed = [
  {
    image: "assets/images/small/img-1.jpg",
    content: "One stop shop destination on all the latest news in crypto currencies",
    date: 'Dec 12, 2021',
    time: '09:22 AM'
  },
  {
    image: "assets/images/small/img-2.jpg",
    content: "Coin Journal is dedicated to delivering stories on the latest crypto",
    date: 'Dec 03, 2021',
    time: '12:09 PM'
  },
  {
    image: "assets/images/small/img-3.jpg",
    content: "The bitcoin-holding U.S. senator is trying to “fully integrate” crypto",
    date: 'Nov 22, 2021',
    time: '11:47 AM'
  },
  {
    image: "assets/images/small/img-6.jpg",
    content: "Cryptocurrency price like Bitcoin, Dash, Dogecoin, Ripple and Litecoin",
    date: 'Nov 18, 2021',
    time: '06:13 PM'
  }
];

/**
 * Stat Counder Data
 */
const analyticstatData = [{
  title: 'Users',
  value: 28.05,
  icon: 'users',
  persantage: '16.24',
  profit: 'up'
}, {
    title: 'Sessions',
    value: 97.66,
    icon: 'activity',
    persantage: '3.96',
    profit: 'down'
}, {
    title: 'Avg. Visit Duration',
    value: 3.40,
    icon: 'clock',
    persantage: '0.24',
    profit: 'down'
}, {
    title: 'Bounce Rate',
    value: 33.48,
    icon: 'external-link',
    persantage: '7.05',
    profit: 'up'
}
];

/**
* Top Selleing
*/
const analyticTopPages = [
  {
      page: "/themesbrand/skote-25867",
      active: '99',
      users: '25.3',
  },
  {
      page: "/dashonic/chat-24518",
      active: '86',
      users: '22.7',
  },
  {
      page: "/skote/timeline-27391",
      active: '64',
      users: '18.7',
  },
  {
      page: "/themesbrand/minia-26441",
      active: '53',
      users: '14.2',
  },
  {
      page: "/dashon/dashboard-29873",
      active: '33',
      users: '12.6',
  },
  {
      page: "/doot/chats-29964",
      active: '20',
      users: '10.9',
  },
  {
      page: "/steex/pages-29739",
      active: '10',
      users: '07.3',
  }
];


export { analyticstatData, analyticTopPages, BestSelling, TopSelling, Recentelling, statData, cryptostatData, cryptoBitcoinChart, cryptolitecoinChart, cryptoEatherreumChart, cryptoBinanceChart, cryptoDashChart, cryptoTetherChart, cryptoNeoChart, cryptoCurrencies, cryptoTopPerformers, cryptoNewsFeed };

