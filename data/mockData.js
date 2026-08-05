export const CATEGORIES = [
  {
    id: "ethnic-wear",
    name: "Ethnic & Festive",
    slug: "ethnic-wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    itemCount: 1420,
    badge: "Trending",
    iconName: "Sparkles",
    subtitle: "Chanderi, Zari & Sarees"
  },
  {
    id: "electronics",
    name: "Smart Tech & ANC",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
    itemCount: 890,
    badge: "Best Value",
    iconName: "Headphones",
    subtitle: "ANC Audio & Wearables"
  },
  {
    id: "footwear",
    name: "Footwear & Sneakers",
    slug: "footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    itemCount: 650,
    badge: "Hot Deal",
    iconName: "Zap",
    subtitle: "Marathon & Sneakers"
  },
  {
    id: "home-decor",
    name: "Handcrafted Decor",
    slug: "home-decor",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
    itemCount: 430,
    badge: "Artisanal",
    iconName: "Award",
    subtitle: "Dhokra Brass & Heritage"
  },
  {
    id: "wellness",
    name: "Ayurveda & Glow",
    slug: "wellness",
    image: "https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=600&q=80",
    itemCount: 310,
    badge: "100% Organic",
    iconName: "Leaf",
    subtitle: "Saffron Oil & Organic"
  }
];

export const PRODUCTS = [
  {
    id: "1",
    title: "Hand-Embroidered Chanderi Silk Anarkali Set",
    slug: "chanderi-silk-anarkali-set",
    price: 3499,
    mrp: 6999,
    discount: 50,
    isNew: true,
    rating: 4.8,
    reviewsCount: 342,
    category: "Ethnic & Festive",
    categorySlug: "ethnic-wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rolloverImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    ],
    hotspots: [
      {
        id: "h1",
        top: "28%",
        left: "48%",
        title: "24K Gold Zari Neckline",
        zoomRatio: "4.5x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80",
        detail: "Hand-embroidered 24K tested Zari threading crafted by GI-tagged master weavers in Chanderi.",
        techSpecs: "Thread Density: 120 TPI • Zari Grade: Premium Tested"
      },
      {
        id: "h2",
        top: "55%",
        left: "62%",
        title: "Pure Chanderi Silk Weave",
        zoomRatio: "3.8x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
        detail: "Ultra-breathable natural silk warp & cotton weft producing a subtle translucent luster.",
        techSpecs: "Composition: 70% Pure Silk / 30% Cotton"
      },
      {
        id: "h3",
        top: "82%",
        left: "38%",
        title: "3.5m Flared Gota Patti Border",
        zoomRatio: "3.0x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
        detail: "Heavily weighted hemline with hand-stitched golden Gota Patti border piping.",
        techSpecs: "Border Width: 4 Inches • Stitch Type: Double Lock"
      }
    ],
    inStock: true,
    stockCount: 14,
    authenticityGrade: "GI Heritage Certified",
    lifestyleBadges: ["GI Tagged", "Pure Chanderi Silk", "Handloom Zari"],
    variations: ["S", "M", "L", "XL", "Custom Tailored"],
    localStoreAvailable: true,
    localStoreName: "Bengaluru Indiranagar Store (In Stock)",
    expressPincodes: ["110001", "400001", "560001", "700001", "500001", "600001"],
    seoDescription: "Buy royal Hand-Embroidered Chanderi Silk Anarkali Set online at best price in India. Authentic zari work, breathable silk blend with dupatta included.",
    features: [
      "Authentic Chanderi Silk with intricate Zari embroidery",
      "Includes matching Dupatta and Churidar pants",
      "Dry clean recommended for long-lasting sheen",
      "BIS IS 19000:2022 Quality Assured Merchant"
    ],
    reviews: [
      {
        id: "r1",
        user: "Priya Sharma",
        location: "New Delhi",
        rating: 5,
        date: "2026-07-20",
        verified: true,
        mediaUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80",
        hasVideo: true,
        comment: "Absolutely stunning saree set! The zari work is exact as shown in the video reel. Shipped in 2 days via Delhivery."
      }
    ]
  },
  {
    id: "2",
    title: "ProBass Velocity ANC Wireless Headphones",
    slug: "probass-velocity-anc-headphones",
    price: 2299,
    mrp: 4999,
    discount: 54,
    isNew: false,
    rating: 4.6,
    reviewsCount: 1250,
    category: "Smart Tech & ANC",
    categorySlug: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    rolloverImage: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
    ],
    hotspots: [
      {
        id: "h1",
        top: "32%",
        left: "52%",
        title: "Dual Feedforward ANC Mics",
        zoomRatio: "5.0x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
        detail: "Suppresses 30dB ambient background noise on flights and Indian railways.",
        techSpecs: "Noise Reduction: -30dB • Mic Tech: MEMS Dual Array"
      },
      {
        id: "h2",
        top: "65%",
        left: "32%",
        title: "Protein Leather Memory Foam",
        zoomRatio: "4.0x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=400&q=80",
        detail: "Ergonomic breathable ear cushions designed for zero heat buildup during 12hr sessions.",
        techSpecs: "Foam Density: Ultra Memory • Outer: Vegan Protein Leather"
      }
    ],
    inStock: true,
    stockCount: 8,
    authenticityGrade: "HD Audio Certified",
    lifestyleBadges: ["ANC 30dB Noise Cancel", "40hr Battery", "Dual Mic Clear Call"],
    variations: ["Matte Black", "Cobalt Blue", "Silver Frost"],
    localStoreAvailable: true,
    localStoreName: "Delhi Connaught Place Store (In Stock)",
    expressPincodes: ["110001", "400001", "560001", "302001"],
    seoDescription: "Shop ProBass Velocity Active Noise Cancelling Wireless Headphones. 40hr battery backup, dual mic clear call clarity, deep bass boost.",
    features: [
      "Active Noise Cancellation (ANC) up to 30dB",
      "40 Hours Playback time with Fast Type-C Charge",
      "Dual Mic Environmental Noise Suppression for HD Voice",
      "1 Year National Warranty & Replacement"
    ],
    reviews: []
  },
  {
    id: "3",
    title: "AeroGlide Pro Stealth Carbon Running Shoes",
    slug: "aeroglide-pro-carbon-running-shoes",
    price: 1899,
    mrp: 3999,
    discount: 52,
    isNew: true,
    rating: 4.7,
    reviewsCount: 610,
    category: "Footwear & Sneakers",
    categorySlug: "footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    rolloverImage: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80"
    ],
    hotspots: [
      {
        id: "h1",
        top: "42%",
        left: "45%",
        title: "Breathable 3D Mesh Upper",
        zoomRatio: "4.2x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        detail: "Engineered Jacquard mesh with micro-ventilation zones for instant sweat dissipation.",
        techSpecs: "Mesh Type: Jacquard 3D • Airflow Rate: 42 CFM"
      },
      {
        id: "h2",
        top: "78%",
        left: "62%",
        title: "Carbon Plate EVA Sole",
        zoomRatio: "4.8x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80",
        detail: "Full-length carbon fiber propulsive plate returning 85% kinetic energy on impact.",
        techSpecs: "Plate Tech: Carbon Composite • Energy Return: 85%"
      }
    ],
    inStock: true,
    stockCount: 22,
    authenticityGrade: "Ergonomic Performance Grade",
    lifestyleBadges: ["Carbon Cushion Sole", "Breathable Mesh", "Orthopedic Fit"],
    variations: ["UK 7", "UK 8", "UK 9", "UK 10"],
    localStoreAvailable: true,
    localStoreName: "Mumbai Bandra Store (In Stock)",
    expressPincodes: ["110001", "400001", "560001", "600001"],
    seoDescription: "Kala running shoes - AeroGlide Pro Stealth Carbon Cushion Running Shoes for men & women. Ultra lightweight mesh, high energy rebound sole.",
    features: [
      "Breathable engineered mesh upper for max airflow",
      "Responsive EVA midsole cushioning for impact absorption",
      "Anti-skid rubber grip outsole for wet Indian roads"
    ],
    reviews: []
  },
  {
    id: "4",
    title: "Handcrafted Brass Dhokra Temple Bell Table Lamp",
    slug: "dhokra-brass-table-lamp",
    price: 2799,
    mrp: 5499,
    discount: 49,
    isNew: false,
    rating: 4.9,
    reviewsCount: 180,
    category: "Handcrafted Decor",
    categorySlug: "home-decor",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    rolloverImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
    ],
    hotspots: [
      {
        id: "h1",
        top: "52%",
        left: "50%",
        title: "Lost-Wax Brass Casting",
        zoomRatio: "5.0x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80",
        detail: "Traditional non-ferrous metal casting using beeswax molds passed down through 4000 years.",
        techSpecs: "Material: 100% Solid Brass • Technique: Cire Perdue"
      }
    ],
    inStock: true,
    stockCount: 5,
    authenticityGrade: "GI Certified Tribal Craft",
    lifestyleBadges: ["Lost-Wax Cast", "100% Solid Brass", "Fair Trade Artisan"],
    variations: ["Standard Lamp", "Dimmer Edition"],
    localStoreAvailable: true,
    localStoreName: "Kolkata Park Street Store (In Stock)",
    expressPincodes: ["110001", "400001", "560001"],
    seoDescription: "Authentic Tribal Dhokra Lost-Wax Cast Brass Table Lamp for home entrance and living room decoration. GI Certified Indian Heritage Craft.",
    features: [
      "100% Solid Brass created using traditional lost-wax technique",
      "Hand-woven linen lampshade included"
    ],
    reviews: []
  },
  {
    id: "5",
    title: "Kumkumadi Tailam Night Rejuvenating Facial Oil (30ml)",
    slug: "kumkumadi-tailam-facial-oil",
    price: 999,
    mrp: 1999,
    discount: 50,
    isNew: true,
    rating: 4.8,
    reviewsCount: 890,
    category: "Ayurveda & Glow",
    categorySlug: "wellness",
    image: "https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=800&q=80",
    rolloverImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=800&q=80"
    ],
    hotspots: [
      {
        id: "h1",
        top: "48%",
        left: "50%",
        title: "Kashmiri Mongra Saffron",
        zoomRatio: "4.5x Macro",
        zoomedImage: "https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=400&q=80",
        detail: "100% Pure Grade-A Pampore Saffron stigmas infused for 26 herbal days.",
        techSpecs: "Purity: 100% Certified Organic • Extracts: 26 Ayurvedic Herbs"
      }
    ],
    inStock: true,
    stockCount: 45,
    authenticityGrade: "AYUSH Organic Certified",
    lifestyleBadges: ["100% Organic", "Kashmiri Saffron", "Paraben Free"],
    variations: ["15ml Trial", "30ml Regular", "50ml Pack"],
    localStoreAvailable: true,
    localStoreName: "Hyderabad Jubilee Hills Store (In Stock)",
    expressPincodes: ["110001", "400001", "560001", "700001", "500001"],
    seoDescription: "Pure Ayurvedic Kumkumadi Tailam with Kashmiri Saffron and 26 herbal extracts for radiant skin texture, anti-pigmentation, and youth glow.",
    features: [
      "Infused with Grade-A Kashmiri Saffron & Lotus Pollen",
      "100% Paraben, Mineral Oil, & Chemical Free"
    ],
    reviews: []
  }
];

export const REELS = [
  {
    id: "reel-1",
    productId: "1",
    title: "Unboxing Royal Silk Anarkali ✨ Festive Look Check!",
    creator: "@style_by_ananya",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-wearing-a-saree-posing-in-a-garden-42654-large.mp4",
    likes: "42.8K",
    comments: "1.2K",
    audio: "Original Sound - Ananya Festive Edit",
    product: PRODUCTS[0]
  },
  {
    id: "reel-2",
    productId: "2",
    title: "ANC Test on Delhi Metro! Are these worth ₹2299? 🎧",
    creator: "@tech_guru_karan",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-listening-to-music-with-headphones-41315-large.mp4",
    likes: "89.1K",
    comments: "3.4K",
    audio: "Bass Boosted Trap - DJ Karan",
    product: PRODUCTS[1]
  }
];

export const MOCK_ORDERS = [
  {
    id: "ORD-94821",
    customerName: "Rajesh Kumar",
    phone: "+91 98765 43210",
    address: "B-402, Sunshine Towers, Indiranagar",
    city: "Bengaluru",
    pincode: "560001",
    items: [
      { title: "ProBass Velocity ANC Headphones", qty: 1, price: 2299 }
    ],
    totalAmount: 2299,
    paymentMethod: "UPI (Google Pay)",
    paymentStatus: "PAID",
    status: "New",
    createdAt: "2026-07-29 21:30",
    courier: "Shiprocket (Delhivery Surface)",
    trackingNo: null,
    labelGenerated: false
  }
];

export const WHATSAPP_SUPPORT_THREADS = [
  {
    id: "w1",
    userPhone: "+91 98999 11223",
    userName: "Priya Sharma",
    lastMessage: "Hi! I submitted my video review for order ORD-94815. When will I get the ₹50 cashback?",
    time: "10:14 AM",
    unread: true,
    messages: [
      { sender: "user", text: "Namaste! I received the Anarkali set yesterday, it's gorgeous!", time: "Yesterday 4:30 PM" }
    ]
  }
];
