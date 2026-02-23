const cartData = [
  { id: 1, img: 'assets/images/products/img-1.png', product: "Branded T-Shirts", quantity: 10, price: 32 },
  { id: 2, img: 'assets/images/products/img-2.png', product: "Bentwood Chair", quantity: 5, price: 18 },
  { id: 3, img: 'assets/images/products/img-3.png', product: "Borosil Paper Cup", quantity: 3, price: 250 },
  { id: 4, img: 'assets/images/products/img-6.png', product: "Gray Styled T-Shirt", quantity: 1, price: 1250 },
  { id: 5, img: 'assets/images/products/img-5.png', product: "Stillbird Helmet", quantity: 2, price: 495 },
];

const allNotification = [
  {
    id: 1,
    desc: "Your author Graphic Optimization reward  is ready! ",
    icon: "bx-badge-check",
    time: "Just 30 sec ago",
    checkboxId: "all-notification-check01",
    state: false
  },
  {
    id: 2,
    title: "Angela Bernier ",
    desc: "Answered to your comment on the cash flow forecast's graph 🔔.",
    img: "assets/images/users/avatar-2.jpg",
    icon: "bx-badge-check",
    time: "48 min ago",
    checkboxId: "all-notification-check02",
    state: false
  },
  {
    id: 3,
    desc: "You have received new messages in the conversation",
    icon: "bx-badge-check",
    time: "2 hrs ago",
    checkboxId: "all-notification-check03",
    state: false
  },
  {
    id: 4,
    title: "Maureen Gibsons",
    desc: "We talked about a project on linkedin.",
    img: "assets/images/users/avatar-8.jpg",
    icon: "bx-badge-check",
    time: "4 HRS ago",
    checkboxId: "all-notification-check04",
    state: false
  },
]

const messages = [
  {
    id: 1,
    avatar: "assets/images/users/avatar-3.jpg",
    name: "James Lemire",
    message: "We talked about a project on linkedin.",
    time_ago: "30 min ago",
    checkboxId: "all-notification-check01",
    state: false

  },
  {
    id: 2,
    avatar: "assets/images/users/avatar-2.jpg",
    name: "Angela Bernier",
    message: "Answered to your comment on the cash flow forecast's graph 🔔.",
    time_ago: "2 hrs ago",
    checkboxId: "all-notification-check02",
    state: false
  },
  {
    id: 3,
    avatar: "assets/images/users/avatar-6.jpg",
    name: "Kenneth Brown",
    message: "Mentioned you in his comment on 📃 invoice #12501.",
    time_ago: "10 hrs ago",
    checkboxId: "all-notification-check03",
    state: false
  },
  {
    id: 4,
    avatar: "assets/images/users/avatar-8.jpg",
    name: "Maureen Gibson",
    message: "We talked about a project on linkedin.",
    time_ago: "3 days ago",
    checkboxId: "all-notification-check04",
    state: false
  }
]

export {
  cartData,
  allNotification,
  messages
};
