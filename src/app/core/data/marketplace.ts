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
  
  export { marketplaceData, tradingData, recentMarketData, popularData };
  