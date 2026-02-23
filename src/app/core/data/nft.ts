const collectionData = [
    {
        id: '1',
        title: "Artwork",
        count: "206",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-06.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-2.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-5.gif' }, { img: 'assets/images/nft/img-03.jpg' }]
            },
        ],
    },
    {
        id: '2',
        title: "Crypto Card",
        count: "743",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-05.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-4.gif' }, { img: 'assets/images/nft/img-04.jpg' }]
            },
        ],
    },
    {
        id: '3',
        title: "Music",
        count: "679",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-02.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-3.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }, { img: 'assets/images/nft/img-01.jpg' }]
            },
        ],
    },
    {
        id: '4',
        title: "Games",
        count: "341",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-03.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-5.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-2.gif' }, { img: 'assets/images/nft/img-05.jpg' }]
            },
        ],
    },
    {
        id: '5',
        title: "Photography",
        count: "1452",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-02.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-3.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }, { img: 'assets/images/nft/img-01.jpg' }]
            },
        ],
    },
    {
        id: '6',
        title: "3d Style ",
        count: "4781",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-05.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-4.gif' }, { img: 'assets/images/nft/img-04.jpg' }]
            },
        ],
    },
    {
        id: '7',
        title: "Collectibles",
        count: "3468",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-06.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-2.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-5.gif' }, { img: 'assets/images/nft/img-03.jpg' }]
            },
        ],
    },
    {
        id: '8',
        title: "Videos",
        count: "1674",
        images: [
            {
                image: [{ img: 'assets/images/nft/img-03.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-5.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-2.gif' }, { img: 'assets/images/nft/img-05.jpg' }]
            },
        ],
    },
];

const creatorsData = [
    {
        id: 1,
        img: 'assets/images/nft/img-01.jpg',
        title: "Timothy Smith",
        price: "4,754 ETH",
    },
    {
        id: 2,
        img: 'assets/images/users/avatar-5.jpg',
        title: "Alexis Clarke",
        price: "81,369 ETH",
    },
    {
        id: 3,
        img: 'assets/images/nft/img-06.jpg',
        title: "Glen Matney",
        price: "13,156 ETH",
    },
    {
        id: 4,
        img: 'https://img.themesbrand.com/velzon/images/img-5.gif',
        title: "Herbert Stokes",
        price: "34,754 ETH",
    },
    {
        id: 5,
        img: 'assets/images/users/avatar-8.jpg',
        title: "Michael Morris",
        price: "13,841 ETH",
    },
    {
        id: 6,
        img: 'assets/images/nft/img-04.jpg',
        title: "Nancy Martino",
        price: "26,834 ETH",
    },
    {
        id: 7,
        img: 'assets/images/nft/img-05.jpg',
        title: "Mary Cousar",
        price: "18,034 ETH",
    },
    {
        id: 8,
        img: 'assets/images/nft/img-02.jpg',
        title: "James Morris",
        price: "63,710 ETH",
    },
];

// Creators List Data
const creatorsListData = [
    {
        id: 1,
        cardImg: 'assets/images/nft/img-03.jpg',
        img: 'assets/images/users/avatar-2.jpg',
        title: "Michael Morris",
        products: "9784",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 2,
        cardImg: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        img: 'assets/images/users/avatar-6.jpg',
        title: "Charles Kubik",
        products: "4678",
        isFollowBtn: true,
        followbtn: "Follow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 3,
        cardImg: 'assets/images/nft/img-05.jpg',
        img: 'assets/images/nft/img-06.jpg',
        title: "Alexis Clarke",
        products: "861",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 4,
        cardImg: 'assets/images/nft/img-06.jpg',
        img: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        title: "James Morris",
        products: "30174",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 5,
        cardImg: 'https://img.themesbrand.com/velzon/images/img-3.gif',
        img: 'assets/images/users/avatar-8.jpg',
        title: "Herbert Stokes",
        products: "6487",
        isFollowBtn: true,
        followbtn: "Follow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 6,
        cardImg: 'assets/images/nft/img-03.jpg',
        img: 'assets/images/users/avatar-2.jpg',
        title: "Michael Morris",
        products: "10137",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 7,
        cardImg: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        img: 'assets/images/users/avatar-6.jpg',
        title: "Tonya Noble",
        products: "364",
        isFollowBtn: true,
        followbtn: "Follow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 8,
        cardImg: 'assets/images/nft/img-05.jpg',
        img: 'assets/images/nft/img-06.jpg',
        title: "Nancy Martino",
        products: "9513",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 9,
        cardImg: 'assets/images/nft/img-01.jpg',
        img: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        title: "Kevin Dawson",
        products: "6374",
        isFollowBtn: true,
        followbtn: "Follow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
    {
        id: 10,
        cardImg: 'https://img.themesbrand.com/velzon/images/img-4.gif',
        img: 'assets/images/users/avatar-10.jpg',
        title: "Glen Matney",
        products: "7809",
        followbtn: "Unfollow",
        content: "You can make an NFT of a digital painting, a text, a piece of music, a video."
    },
];

const exploreData = [
    {
        id: 1,
        img: 'https://img.themesbrand.com/velzon/images/img-3.gif',
        likes: "37.41",
        title: "Walking On Air",
        category: "Artwork",
        type: "gif",
        sale_type: "On Auction",
        highestBid: "10.35",
        price: "14.617",
        isIcon: true,
    },
    {
        id: 2,
        img: 'assets/images/nft/img-03.jpg',
        likes: "19.29",
        title: "Creative Filtered Portrait",
        category: "Photography",
        type: "jpg",
        sale_type: "Has Offers",
        highestBid: "75.3",
        price: "67.36",
    },
    {
        id: 3,
        img: 'assets/images/nft/img-02.jpg',
        likes: "23.63",
        title: "The Chirstoper",
        category: "Music",
        type: "jpg",
        sale_type: "On Auction",
        highestBid: "412.30",
        price: "394.7",
        isIcon: true,
    },
    {
        id: 4,
        img: 'https://img.themesbrand.com/velzon/images/img-4.gif',
        likes: "15.93",
        title: "Evolved Reality",
        category: "Video",
        type: "gif",
        sale_type: "On Auction",
        highestBid: "2.75",
        price: "3.167",
    },
    {
        id: 5,
        img: 'assets/images/nft/img-01.jpg',
        likes: "14.85",
        title: "Abstract Face Painting",
        category: "Collectibles",
        type: "jpg",
        sale_type: "On Auction",
        highestBid: "122.34",
        price: "97.8",
    },
    {
        id: 6,
        img: 'assets/images/nft/img-05.jpg',
        likes: "64.10",
        title: "Long-tailed Macaque",
        category: "Artwork",
        type: "jpg",
        sale_type: "Has Offers",
        highestBid: "874.01",
        price: "745.14",
        isIcon: true,
    },
    {
        id: 7,
        img: 'assets/images/nft/img-06.jpg',
        likes: "36.42",
        title: "Robotic Body Art",
        category: "Artwork",
        type: "jpg",
        sale_type: "Has Offers",
        highestBid: "41.65",
        price: "34.81",
        isIcon: true,
    },
    {
        id: 8,
        img: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        likes: "94.1",
        title: "Trendy Fashion Portraits",
        category: "3d Style",
        type: "gif",
        sale_type: "Has Offers",
        highestBid: "674.92",
        price: "563.81",
    },
    {
        id: 9,
        img: 'assets/images/nft/img-04.jpg',
        likes: "34.12",
        title: "Smillevers Crypto",
        category: "Crypto Card",
        type: "jpg",
        sale_type: "On Auction",
        highestBid: "41.658",
        price: "34.81",
        isIcon: true,
    },
    {
        id: 10,
        img: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        likes: "8.42",
        title: "Patterns Arts & Culture",
        category: "Artwork",
        type: "gif",
        sale_type: "On Auction",
        highestBid: "9.64",
        price: "14.167",
    },
    {
        id: 11,
        img: 'assets/images/nft/img-03.jpg',
        likes: "19.29",
        title: "Creative Filtered Portrait",
        category: "Video",
        type: "jpg",
        sale_type: "On Auction",
        highestBid: "75.3",
        price: "267.36",
    },
    {
        id: 12,
        img: 'https://img.themesbrand.com/velzon/images/img-4.gif',
        likes: "15.93",
        title: "Evolved Reality",
        category: "Games",
        type: "gif",
        sale_type: "On Auction",
        highestBid: "2.75",
        price: "324.26",
    },
    {
        id: 13,
        img: 'assets/images/nft/img-01.jpg',
        likes: "14.85",
        title: "Abstract Face Painting",
        category: "Photography",
        type: "jpg",
        sale_type: "On Auction",
        highestBid: "122.34",
        price: "245.8",
    },
    {
        id: 14,
        img: 'assets/images/nft/img-05.jpg',
        likes: "64.10",
        title: "Long-tailed Macaque",
        category: "Collectibles",
        type: "mp4",
        sale_type: "On Auction",
        highestBid: "874.01",
        price: "340.14",
    },
    {
        id: 15,
        img: 'assets/images/nft/img-06.jpg',
        likes: "36.42",
        title: "Robotic Body Art",
        category: "Photography",
        type: "mp3",
        sale_type: "Has Offers",
        highestBid: "121.81",
        price: "41.658",
    },
];

const marketplaceData = [
    {
        id: '1',
        images: [
            {
                image: [{ img: 'assets/images/nft/img-05.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-4.gif' }, { img: 'assets/images/nft/img-04.jpg' }]
            },
        ],
    },
    {
        id: '2',
        images: [
            {
                image: [{ img: 'assets/images/nft/img-06.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-2.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-5.gif' }, { img: 'assets/images/nft/img-03.jpg' }]
            },
        ],
    },
    {
        id: '3',
        images: [
            {
                image: [{ img: 'assets/images/nft/img-02.jpg' }, { img: 'https://img.themesbrand.com/velzon/images/img-3.gif' }]
            },
            {
                image: [{ img: 'https://img.themesbrand.com/velzon/images/img-1.gif' }, { img: 'assets/images/nft/img-01.jpg' }]
            },
        ],
    }
];

/**
 * trading Artwork
 */
const tradingData = [
    {
        id: 1,
        img: 'assets/images/users/avatar-2.jpg',
        author: "Nancy Martino",
        title: "Owners",
        cardImg: 'assets/images/nft/img-05.jpg',
        likes: "19.29k",
        price: "97.8 ETH",
        category: "Patterns Arts & Culture",
        isActive: false,
    },
    {
        id: 2,
        img: 'assets/images/users/avatar-9.jpg',
        author: "Henry Baird",
        title: "Creators",
        cardImg: 'assets/images/nft/img-03.jpg',
        likes: "31.64k",
        price: "475.23 ETH",
        category: "Evolved Reality",
        isActive: true,
    },
    {
        id: 3,
        img: 'assets/images/users/avatar-10.jpg',
        author: "Diana Kohler",
        title: "Owners",
        cardImg: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        likes: "8.34k",
        price: "701.38 ETH",
        category: "Long-tailed Macaque",
        isActive: false,
    },
    {
        id: 4,
        img: 'assets/images/users/avatar-8.jpg',
        author: "James Price",
        title: "Owners",
        cardImg: 'assets/images/nft/img-06.jpg',
        likes: "29.20k",
        price: "917.83 ETH",
        category: "Robotic Body Art",
        isActive: true,
    },
    {
        id: 5,
        img: 'assets/images/users/avatar-2.jpg',
        author: "Rickey Teran",
        title: "Creators",
        cardImg: 'assets/images/nft/img-03.jpg',
        likes: "78.34k",
        price: "571.24 ETH",
        category: "Creative Filtered Portrait",
        isActive: true,
    },
];

/**
 * Recent NFTs Artwork
 */
const recentMarketData = [
    {
        id: 1,
        img: 'assets/images/nft/img-02.jpg',
        likes: "23.63k",
        title: "The Chirstoper",
        category: "Music",
        highest: "412.30ETH",
        price: "394.7 ETH",
    },
    {
        id: 2,
        img: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        likes: "94.1k",
        title: "Trendy Fashion Portraits",
        category: "3d Style",
        highest: "674.92 ETH",
        price: "563.81 ETH",
    },
    {
        id: 3,
        img: 'assets/images/nft/img-04.jpg',
        likes: "34.12k",
        title: "Smillevers Crypto",
        category: "Crypto Card",
        highest: "41.658 ETH",
        price: "34.81 ETH",
    },
    {
        id: 4,
        img: 'https://img.themesbrand.com/velzon/images/img-4.gif',
        likes: "15.93k",
        title: "Evolved Reality",
        category: "Video",
        highest: "2.75ETH",
        price: "3.167 ETH",
    },
    {
        id: 5,
        img: 'assets/images/nft/img-01.jpg',
        likes: "14.85k",
        title: "Abstract Face Painting",
        category: "Collectibles",
        highest: "122.34ETH",
        price: "97.8 ETH",
    },
];

/**
 * Popular Creators
 */
const popularData = [
    {
        id: 1,
        cardImg: 'assets/images/nft/img-03.jpg',
        img: 'assets/images/users/avatar-1.jpg',
        author: "Tonya Noble",
        products: 5048,
        isFollow: true,
    },
    {
        id: 2,
        cardImg: 'https://img.themesbrand.com/velzon/images/img-5.gif',
        img: 'assets/images/nft/img-04.jpg',
        author: "Kevin Dawson",
        products: 649,
    },
    {
        id: 3,
        cardImg: 'assets/images/nft/img-01.jpg',
        img: 'assets/images/nft/img-06.jpg',
        author: "Herbert Stokes",
        products: 918,
    },
    {
        id: 4,
        cardImg: 'assets/images/nft/img-05.jpg',
        img: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        author: "Thomas Taylor",
        products: 345,
        isFollow: true,
    },
    {
        id: 2,
        cardImg: 'assets/images/nft/img-02.jpg',
        img: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        author: "James Price",
        products: 745,
        isFollow: true,
    },
];

const rankingData = [
    {
        ranking: "#1",
        img: 'assets/images/nft/img-01.jpg',
        collection: "Abstract Face Painting",
        volume_price: "7,50,000",
        hours: 342.35,
        day: 312.35,
        item: "10k",
        floor_price: "33.02",
    },
    {
        ranking: "#2",
        img: 'https://img.themesbrand.com/velzon/images/img-1.gif',
        collection: "Patterns Arts & Culture",
        volume_price: "32,850",
        hours: -42.03,
        day: 20.14,
        item: "8k",
        floor_price: "74.69",
    },
    {
        ranking: "#3",
        img: 'assets/images/nft/img-02.jpg',
        collection: "Creative Filtered Portrait",
        volume_price: "1,36,000",
        hours: 170.31,
        day: -415.21,
        item: "15k",
        floor_price: "67.16",
    },
    {
        ranking: "#4",
        img: 'https://img.themesbrand.com/velzon/images/img-2.gif',
        collection: "Long-tailed Macaque",
        volume_price: "3,63,000",
        hours: 709.13,
        day: -645.1,
        item: "21k",
        floor_price: "137.09",
    },
    {
        ranking: "#5",
        img: 'assets/images/nft/img-04.jpg',
        collection: "Robotic Body Art",
        volume_price: "25,800",
        hours: -347.42,
        day: -321.17,
        item: "17k",
        floor_price: "343.75",
    },
    {
        ranking: "#6",
        img: 'assets/images/nft/img-06.jpg',
        collection: "Smillevers Crypto",
        volume_price: "37,100",
        hours: 1.42,
        day: 0.64,
        item: "31k",
        floor_price: "1.87",
    },
    {
        ranking: "#7",
        img: 'https://img.themesbrand.com/velzon/images/img-5.gif',
        collection: "The Chirstoper",
        volume_price: "1,87,600",
        hours: -31.49,
        day: 26.07,
        item: "18k",
        floor_price: "101.12",
    },
    {
        ranking: "#8",
        img: 'https://img.themesbrand.com/velzon/images/img-3.gif',
        collection: "Walking On Air",
        volume_price: "4,62,000",
        hours: 238.13,
        day: 183.4,
        item: "8.3k",
        floor_price: "143.39",
    },
    {
        ranking: "#9",
        img: 'assets/images/nft/img-05.jpg',
        collection: "The Chirstoper",
        volume_price: "74,950",
        hours: -31.49,
        day: -26.07,
        item: "7.9k",
        floor_price: "101.12",
    },
    {
        ranking: "#10",
        img: 'assets/images/nft/img-03.jpg',
        collection: "Walking On Air",
        volume_price: "3,35,750",
        hours: 238.13,
        day: -64.3,
        item: "8.3k",
        floor_price: "143.39",
    },
    {
        ranking: "#11",
        img: 'assets/images/nft/img-04.jpg',
        collection: "Highstreet IHO Part",
        volume_price: "35,750",
        hours: 23.1,
        day: -64.36,
        item: "12.3k",
        floor_price: "367.39",
    }
];

const nftwalletData = [
    {
        id: 1,
        img: 'assets/images/nft/wallet/metamask.png',
        title: "Metamask",
        textContent: "MetaMask is a software cryptocurrency wallet used to interact with the Ethereum blockchain.",
    },
    {
        id: 2,
        img: 'assets/images/nft/wallet/coinbase.png',
        title: "Coinbase Wallet",
        textContent: "Coinbase Wallet is a software product that gives you access to a wide spectrum.",
    },
    {
        id: 3,
        img: 'assets/images/nft/wallet/kukai.png',
        title: "Kukai Wallet",
        textContent: "Kukai is a seamless browser-based wallet that allows users to store, transfer, and delegate.",
    },
    {
        id: 4,
        img: 'assets/images/nft/wallet/binance.png',
        title: "Binance",
        textContent: "Binance offers a relatively secure, versatile way to invest in and trade cryptocurrencies.",
    },
    {
        id: 5,
        img: 'assets/images/nft/wallet/enjin.png',
        title: "Enjin Wallet",
        textContent: "Enjin is a store of value that can be used in the non-fungible token (NFT) marketplace.",
    },
    {
        id: 6,
        img: 'assets/images/nft/wallet/alpha.png',
        title: "Alpha Wallet",
        textContent: "AlphaWallet uses the TokenScript framework, which makes tokens become “smart”.",
    },
    {
        id: 7,
        img: 'assets/images/nft/wallet/math.png',
        title: "Math Wallet",
        textContent: "Math DApp Factory gives users tools that can simplify the development of exchanges, games",
    },
];


export { collectionData, creatorsData, creatorsListData, exploreData, marketplaceData, tradingData, recentMarketData, popularData, rankingData, nftwalletData };
