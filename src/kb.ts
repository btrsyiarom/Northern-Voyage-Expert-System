/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { POI, FoodEntry } from './types';

export const KNOWLEDGE_BASE: POI[] = [
  // ==========================================
  // PENANG (PULAU PINANG) - 10 POIs
  // ==========================================
  {
    id: 'penang_gt_heritage',
    state: 'Penang',
    name: 'Georgetown Heritage Trail',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free – RM15',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Explore the vibrant historical streets of Georgetown filled with historical clan houses, vintage architecture, and rich local multi-ethnic heritage.'
  },
  {
    id: 'penang_street_art',
    state: 'Penang',
    name: 'Penang Street Art',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'The famous wall interactive murals by Ernest Zacharevic, capturing charming real-life Malaysian scenes integrated with physical props.'
  },
  {
    id: 'penang_kek_lok_si',
    state: 'Penang',
    name: 'Kek Lok Si Temple',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free – RM8',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'One of the largest, most spectacular Buddhist temples in Southeast Asia, showcasing a brilliant blend of Chinese, Thai, and Burmese architectural details.'
  },
  {
    id: 'penang_hill',
    state: 'Penang',
    name: 'Penang Hill',
    category: 'nature_eco',
    costTier: 'medium',
    estCost: 'RM30 – RM80',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Take an iconic funicular train up Penang Hill for panoramic views of George Town, cool mountain air, and lush rainforest canopy walks.'
  },
  {
    id: 'penang_hawker_food',
    state: 'Penang',
    name: 'Hawker Food Trail',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'RM10 – RM30',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Dive into world-famous street food hubs for Laksa, Char Kway Teow, and Cendol. Note that non-halal and halal options are intermingled.'
  },
  {
    id: 'penang_khoo_kongsi',
    state: 'Penang',
    name: 'Khoo Kongsi Clanhouse',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'RM15',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A magnificent, highly ornamented Chinese clan association architectural masterpiece reflecting the golden era of Straits Chinese immigrants.'
  },
  {
    id: 'penang_batu_ferringhi',
    state: 'Penang',
    name: 'Batu Ferringhi Beach',
    category: 'coastal_beach',
    costTier: 'medium',
    estCost: 'Free – RM50',
    activity_intensity: 'active',
    childFriendly: true,
    description: 'A popular sandy beach offering parasailing, jet skiing, dynamic night markets, and sunset-facing beachfront dining outlets.'
  },
  {
    id: 'penang_escape',
    state: 'Penang',
    name: 'ESCAPE Penang',
    category: 'adventure',
    costTier: 'high',
    estCost: 'RM180',
    activity_intensity: 'active',
    childFriendly: true,
    description: 'An elite gravity-play adventure park set in nature, containing the world\'s longest tube water slide and complex aerial high ropes obstacle courses.'
  },
  {
    id: 'penang_peranakan_mansion',
    state: 'Penang',
    name: 'Pinang Peranakan Mansion',
    category: 'historical_heritage',
    costTier: 'medium',
    estCost: 'RM20',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A beautifully restored emerald-green mansion housing thousands of Babas & Nyonyas antique heirlooms, jewelry, and luxury lifeware.'
  },
  {
    id: 'penang_little_india',
    state: 'Penang',
    name: 'Little India, Georgetown',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A colorful enclave alive with Bollywood music, aromatic curry spices, colorful saree boutiques, and incredible Indian street foods.'
  },

  // ==========================================
  // PERAK - 10 POIs
  // ==========================================
  {
    id: 'perak_ubudiah_mosque',
    state: 'Perak',
    name: 'Ubudiah Royal Mosque Kuala Kangsar',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Commanding a scenic ridge, this architectural icon of Malaysia features a grand golden main dome, elegant minarets, and Italian marble detailing.'
  },
  {
    id: 'perak_lost_world',
    state: 'Perak',
    name: 'Lost World of Tambun, Ipoh',
    category: 'adventure',
    costTier: 'high',
    estCost: 'RM60 – RM120',
    activity_intensity: 'active',
    childFriendly: true,
    description: 'An expansive theme-park complex nested inside beautiful ancient limestone hill forests. Features water slides, petting zoos, hot springs, and zip lines.'
  },
  {
    id: 'perak_ipoh_heritage_walk',
    state: 'Perak',
    name: 'Ipoh Heritage Walk (Old Town)',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Explore the architectural monuments left of the tin-mining boom era. Stroll through Concubine Lane, Ipoh Railway Station, and retro alley arts.'
  },
  {
    id: 'perak_taiping_gardens',
    state: 'Perak',
    name: 'Taiping Lake Gardens',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'The oldest public botanic garden in Malaysia, famous for its ancient, massive rain trees with majestic branches dipping into clear lake waters.'
  },
  {
    id: 'perak_zoo_taiping',
    state: 'Perak',
    name: 'Zoo Taiping & Night Safari',
    category: 'nature_eco',
    costTier: 'medium',
    estCost: 'RM30 – RM60',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A beautiful open-concept wildlife reserve containing diverse Malayan species. Ride the night locomotive tour to view nocturnal animal behaviors.'
  },
  {
    id: 'perak_pangkor_island',
    state: 'Perak',
    name: 'Pangkor Island',
    category: 'coastal_island',
    costTier: 'medium',
    estCost: 'RM20',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'A lovely mountainous island featuring white sandy bays, hornbill feeding trails, local dried seafood shopping warehouses, and snorkeling spots.'
  },
  {
    id: 'perak_gua_tempurung',
    state: 'Perak',
    name: 'Gua Tempurung Cave',
    category: 'adventure',
    costTier: 'medium',
    estCost: 'RM15 – RM35',
    activity_intensity: 'active',
    childFriendly: false,
    description: 'One of the longest and largest limestone caves in Peninsular Malaysia. Offers incredible stalactite galleries and physically demanding wet river spelunking.'
  },
  {
    id: 'perak_kellies_castle',
    state: 'Perak',
    name: 'Kellies Castle, Batu Gajah',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'RM10',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'A massive, unfinished Scottish country castle built by pioneer William Kellie-Smith, shrouded in historical tales of romance, tragedy, and secret tunnels.'
  },
  {
    id: 'perak_royal_belum',
    state: 'Perak',
    name: 'Royal Belum Rainforest (Gerik)',
    category: 'nature_eco',
    costTier: 'high',
    estCost: 'RM100 – RM300+',
    activity_intensity: 'active',
    childFriendly: false,
    description: 'One of the oldest pristine tropical rainforests in the world. Seek high-energy hiking search of the rare Rafflesia flower and indigenous Temiar settlements.'
  },
  {
    id: 'perak_ipoh_food_scene',
    state: 'Perak',
    name: 'Ipoh Food Scene',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'RM15 – RM40',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Taste authentic dry Ipoh Hor Fun, refreshing white coffee, egg tarts, and famous bean sprout chicken (halal-certified options available).'
  },

  // ==========================================
  // KEDAH - 10 POIs
  // ==========================================
  {
    id: 'kedah_zahir_mosque',
    state: 'Kedah',
    name: 'Zahir Mosque, Alor Setar',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Constructed in 1912, this majestic state mosque is styled in classic Moorish domes and is ranked among the most beautiful mosques globally.'
  },
  {
    id: 'kedah_langkawi',
    state: 'Kedah',
    name: 'Langkawi Island',
    category: 'coastal_island',
    costTier: 'high',
    estCost: 'RM50 – RM200+',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'The jewel of Kedah. A legendary archipelago featuring high-altitude cable cars, beautiful sand beaches, mangrove boat tours, and Duty-Free ports.'
  },
  {
    id: 'kedah_paddy_museum',
    state: 'Kedah',
    name: 'Kedah Paddy Museum, Alor Setar',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM2',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A highly structured museum housing a breathtaking, massive 360-degree rotating painting depicting the lush Kedah padi field horizons.'
  },
  {
    id: 'kedah_bujang_valley',
    state: 'Kedah',
    name: 'Bujang Valley Archaeological Museum',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'The richest archaeological historical landscape of Malaysia, holding ancient Hindu-Buddhist candi architectures dating back more than 1,500 years.'
  },
  {
    id: 'kedah_kuala_kedah_fort',
    state: 'Kedah',
    name: 'Kuala Kedah Fort',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free – RM5',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A scenic, historical coastal fort that guarded the Kedah empire river entryway from Portuguese, Siamese, and British naval invaders.'
  },
  {
    id: 'kedah_gunung_jerai',
    state: 'Kedah',
    name: 'Gunung Jerai',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'Free – RM20',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'A prominent 1,217m mountain towering over paddy plains. Climb or hire a driver for a beautiful mountain forest respite.'
  },
  {
    id: 'kedah_sungai_sedim',
    state: 'Kedah',
    name: 'Sungai Sedim Tree Top Walk',
    category: 'adventure',
    costTier: 'low',
    estCost: 'RM10 – RM20',
    activity_intensity: 'active',
    childFriendly: true,
    description: 'A magnificent 925m long structural iron bridge elevated 26 meters above the rainforest floor, looking down on the gushing Sungai Sedim white rapids.'
  },
  {
    id: 'kedah_alor_setar_tower',
    state: 'Kedah',
    name: 'Alor Setar Tower',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'RM6 – RM8',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A 165.5-meter architectural telecom tower. Ascend to the revolving sky observatory for high-elevation vistas of Alor Setar and Straits of Malacca.'
  },
  {
    id: 'kedah_mahathir_birthplace',
    state: 'Kedah',
    name: 'Rumah Kelahiran Mahathir',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'The childhood home museum of Tun Dr. Mahathir Mohamad, documenting his early formative years and family history in classic Malay wood architecture.'
  },
  {
    id: 'kedah_ulu_muda',
    state: 'Kedah',
    name: 'Ulu Muda Eco Park',
    category: 'nature_eco',
    costTier: 'high',
    estCost: 'RM50 – RM150',
    activity_intensity: 'active',
    childFriendly: false,
    description: 'An expansive wilderness preserve famous for rare wildlife, salt licks, wild elephant safaris, and traditional boat river journeys.'
  },

  // ==========================================
  // PERLIS - 10 POIs
  // ==========================================
  {
    id: 'perlis_gua_kelam',
    state: 'Perlis',
    name: 'Gua Kelam',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM2 – RM5',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'Walk along a 370-meter wooden suspension boardwalk inside illuminated ancient tin-mining tunnels with sound of flowing clean subterranean rivers.'
  },
  {
    id: 'perlis_wang_kelian',
    state: 'Perlis',
    name: 'Wang Kelian Viewpoint',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM2 – RM5',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'A high panoramic look-out at 304m. Wake up early for the famous "carpet of clouds" rolling over the green limestone borders of Thailand.'
  },
  {
    id: 'perlis_state_park',
    state: 'Perlis',
    name: 'Perlis State Park (Wang Burma)',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'Free – RM10',
    activity_intensity: 'active',
    childFriendly: false,
    description: 'The ancient semi-deciduous forest on limestone hills. Explore Wang Burma cave or challenge the high canopy trekking trails.'
  },
  {
    id: 'perlis_timah_tasoh',
    state: 'Perlis',
    name: 'Timah Tasoh Lake',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM10 – RM70',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A beautiful, calm freshwater reservoir framed by the iconic Bukit Chabang twin peaks. Excellent for sunset photowalks or bird watching boat rides.'
  },
  {
    id: 'perlis_nipah_kipli',
    state: 'Perlis',
    name: 'Nipah Kipli Farm',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM15 – RM30',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Sit in dynamic wooden huts underneath clusters of Nipah palm trees. Savour fresh local Laksa Perlis, bihun soup, and refreshing fresh Nipah sap drinks.'
  },
  {
    id: 'perlis_kangar_street_art',
    state: 'Perlis',
    name: 'Kangar Street Art',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Stroll down colorful shopfront lanes in the heart of Kangar, carrying bespoke cultural, historic, and agricultural thematic wall murals.'
  },
  {
    id: 'perlis_alwi_mosque',
    state: 'Perlis',
    name: 'Alwi Mosque, Kangar',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A gorgeous heritage mosque constructed in 1932 using Neo-Classical elements, featuring a stunning golden dome and pristine whitewashed walls.'
  },
  {
    id: 'perlis_snake_farm',
    state: 'Perlis',
    name: 'Perlis Snake Farm',
    category: 'nature_eco',
    costTier: 'low',
    estCost: 'RM5 – RM10',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'The largest snake sanctuary in Malaysia. High-interest education galleries showing snake breeding, iguanas, giant tortoises, and a quaint petting farm.'
  },
  {
    id: 'perlis_kota_kayang',
    state: 'Perlis',
    name: 'Kota Kayang Museum',
    category: 'historical_heritage',
    costTier: 'low',
    estCost: 'Free',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'Set in a scenic park enclosed by towering karst hills. Houses prehistoric archaeological relics, ancient sultanate gold coins, and Kedah/Perlis history relics.'
  },
  {
    id: 'perlis_padang_besar_market',
    state: 'Perlis',
    name: 'Padang Besar Border Market',
    category: 'shopping',
    costTier: 'low',
    estCost: 'Free entry',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'The busy duty-free shopping complex at the Thailand border. Excellent place to hunt for affordable Thai foods, garments, souvenirs, and hot local snacks.'
  },
  {
    id: 'penang_gurney_shopping',
    state: 'Penang',
    name: 'Gurney Plaza & Gurney Drive Shopping',
    category: 'shopping',
    costTier: 'medium',
    estCost: 'Free entry',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'A premier waterfront shopping district featuring dozens of global retail brands, local souvenir boutiques, and extensive tech/fashion choices.'
  },
  {
    id: 'perak_concubine_lane_bazaar',
    state: 'Perak',
    name: 'Concubine Lane Heritage Bazaar',
    category: 'shopping',
    costTier: 'low',
    estCost: 'Free entry',
    activity_intensity: 'moderate',
    childFriendly: true,
    description: 'A historic narrow alleyway in Ipoh Old Town packed with bustling local souvenir stalls, traditional pastries, retro trinkets, and crafts.'
  },
  {
    id: 'kedah_langkawi_duty_free',
    state: 'Kedah',
    name: 'Kuah Town Duty-Free Shopping Malls',
    category: 'shopping',
    costTier: 'medium',
    estCost: 'Free entry',
    activity_intensity: 'light',
    childFriendly: true,
    description: 'The ultimate commercial haven in Langkawi, loaded with tax-free chocolates, kitchenware, cosmetics, and confectionery.'
  }
];

export const FOOD_DB: FoodEntry[] = [
  // ==========================================
  // PENANG (7 rows)
  // ==========================================
  {
    food_id: 'penang_f1',
    state: 'Penang',
    name: 'Jawi House Cafe Gallery, George Town',
    description: 'An award-winning vintage restaurant on Armenian Street offering authentic Jawi Peranakan heritage dishes like herbal rice (Nasi Lemuni) and traditional spiced beef.',
    halal_status: 'halal'
  },
  {
    food_id: 'penang_f2',
    state: 'Penang',
    name: 'Hameediyah Restaurant, George Town',
    description: 'Operating since 1907, Malaysia\'s oldest active Nasi Kandar diner. Famous for savory beef rendang, thick chicken biryani, and crispy murtabak.',
    halal_status: 'halal'
  },
  {
    food_id: 'penang_f3',
    state: 'Penang',
    name: 'Deens Maju, George Town',
    description: 'A wildly popular, legendary Nasi Kandar eatery in Penang, famous for its succulent fried chicken, aromatic biryani, and deeply flavorful mixed curry gravies (kuah campur).',
    halal_status: 'halal'
  },
  {
    food_id: 'penang_f4',
    state: 'Penang',
    name: 'Kesum Art Restaurant, George Town',
    description: 'A unique gallery-styled boutique diner serving flavorful Southern Malay heritage dishes, including Johorean Laksa, Nasi Kerabu, and authentic asam pedas.',
    halal_status: 'halal'
  },
  {
    food_id: 'penang_f5',
    state: 'Penang',
    name: 'Hameed Pata Special Mee',
    description: 'A highly famous open-air street food stall at the historic Padang Kota Lama Esplanade, renowned for its rich squid-infused sweet-spicy fried noodle platter.',
    halal_status: 'halal'
  },
  {
    food_id: 'penang_f6',
    state: 'Penang',
    name: 'Makan Kitchen, Batu Ferringhi',
    description: 'An upscale dining venue inside DoubleTree by Hilton, featuring rich interactive live kitchens that serve premium local Chinese, Malay, and Indian specialty buffet spreads.',
    halal_status: 'non_halal'
  },
  {
    food_id: 'penang_f7',
    state: 'Penang',
    name: 'Beach St. Bistrot, George Town',
    description: 'A premium, modern European-bistro style kitchen on historic Beach Street, celebrated for exceptional seasonal French-inspired meals, charcuterie and mains.',
    halal_status: 'non_halal'
  },

  // ==========================================
  // PERAK (7 rows)
  // ==========================================
  {
    food_id: 'perak_f1',
    state: 'Perak',
    name: 'Restoran New Holly Wood, Ipoh',
    description: 'A highly famous food court style Hainanese kopitiam serving delicious Muslim-friendly, Halal-certified Chinese hawker favorites including char kway teow, dim sum and chee cheong fun.',
    halal_status: 'halal'
  },
  {
    food_id: 'perak_f2',
    state: 'Perak',
    name: 'STG taiping , taiping',
    description: 'Sabah Tea Garden in Taiping, a stunning colonial-style boutique mansion restaurant serving high quality tea blends and premium western-local fusion entries.',
    halal_status: 'halal'
  },
  {
    food_id: 'perak_f3',
    state: 'Perak',
    name: 'Tiffin Restaurant, Ipoh',
    description: 'An elegant contemporary dining venue inside the WEIL Hotel, highly celebrated for its extensive premium buffet layouts and authentic regional Perak delicacies.',
    halal_status: 'halal'
  },
  {
    food_id: 'perak_f4',
    state: 'Perak',
    name: 'Ansari Famous Cendol, Taiping',
    description: 'Operating since 1940, a historic local legacy spot legendary for its refreshing sweet shaved ice Cendol topped with rich coconut milk, Gula Melaka, and sticky rice pulut.',
    halal_status: 'halal'
  },
  {
    food_id: 'perak_f5',
    state: 'Perak',
    name: 'Canning Dim Sum, Ipoh',
    description: 'A bright, popular Halal-certified casual dim sum restaurant in Ipoh, serving beautifully cooked, colorful dumplings, fresh bao buns, and signature pastries.',
    halal_status: 'halal'
  },
  {
    food_id: 'perak_f6',
    state: 'Perak',
    name: 'Peng Cheng Tang Fresh Seafood, Taiping',
    description: 'A highly loved local Chinese traditional diner in Taiping, known for wok-fired fresh seafood delicacies simmered in traditional garlic herbs and savory sweet sauces.',
    halal_status: 'non_halal'
  },
  {
    food_id: 'perak_f7',
    state: 'Perak',
    name: 'Brick red kitchen, Ipoh',
    description: 'A stylish modern loft-style kitchen in Ipoh, offering savory grilled meats, comforting western plates, and rich appetizers inside a charming brick-exposed setting.',
    halal_status: 'non_halal'
  },

  // ==========================================
  // KEDAH (7 rows)
  // ==========================================
  {
    food_id: 'kedah_f1',
    state: 'Kedah',
    name: 'Haji Ramli Restaurant Nasi Kandar, Alor Setar',
    description: 'A highly praised local diner serving excellent northern style Nasi Kandar, featuring succulent honey chicken, soft mutton pieces, fresh okra, and complex mixed curry stews.',
    halal_status: 'halal'
  },
  {
    food_id: 'kedah_f2',
    state: 'Kedah',
    name: 'Iman Koteaw, Alor Setar',
    description: 'An Alor Setar landmark beloved for its smoking hot, moist stir-fried flat rice noodles (Kway Teow) enriched with juicy sea prawns, cockles, and fragrant soy reduction.',
    halal_status: 'halal'
  },
  {
    food_id: 'kedah_f3',
    state: 'Kedah',
    name: 'Pallet Cafe - S.P., Sungai Petani',
    description: 'A cozy, aesthetically rustic cafe in Sungai Petani styled with eco-friendly pallet wood, featuring aromatic specialty coffee, western desserts, and modern fusion cuisines.',
    halal_status: 'halal'
  },
  {
    food_id: 'kedah_f4',
    state: 'Kedah',
    name: 'Overstepped Cafe, Sungai Petani',
    description: 'A lively, brightly lit contemporary youth hotspot in Sungai Petani offering gourmet thick-patty western burgers, cheesy fries, and sweet creamy beverages.',
    halal_status: 'halal'
  },
  {
    food_id: 'kedah_f5',
    state: 'Kedah',
    name: 'RESTAURANT RT, Alor Setar',
    description: 'A long-running, local Chinese-Muslim dining house famous for its top-notch stir-fried dishes, premium noodle soups, and delicious shared seafood dishes.',
    halal_status: 'halal'
  },
  {
    food_id: 'kedah_f6',
    state: 'Kedah',
    name: 'Art Nature Gallery Cafe, Alor Setar',
    description: 'An elegant gallery-style garden restaurant and craft coffee hub in Alor Setar, serving delicate western brunch baskets, fresh pastries, and artistic sweet plates.',
    halal_status: 'non_halal'
  },
  {
    food_id: 'kedah_f7',
    state: 'Kedah',
    name: 'Thai Charean Dee Restaurant, Sungai Petani',
    description: 'An authentic Southern Thai country-style roadside diner in SP, celebrated for fiery-hot seafood Tom Yum, lime-steamed fish, and sweet mango sticky rice desserts.',
    halal_status: 'non_halal'
  },

  // ==========================================
  // PERLIS (7 rows)
  // ==========================================
  {
    food_id: 'perlis_f1',
    state: 'Perlis',
    name: 'Restoran Singgah Rasa Utara, Arau',
    description: 'A very popular traditional northern Malay restaurant in Royal Arau, serving delicious authentic ulam-ulam, grilled catfish, sambals, and rich spicy village broths.',
    halal_status: 'halal'
  },
  {
    food_id: 'perlis_f2',
    state: 'Perlis',
    name: 'Restoran Api-Api Ikan Bakar, Kuala Perlis',
    description: 'A famous open-air dockside charcoal-grilled seafood eatery, legendary for fresh local snapper, squid, and stingray grilled with delicious sweet-spicy sambal layers.',
    halal_status: 'halal'
  },
  {
    food_id: 'perlis_f3',
    state: 'Perlis',
    name: 'Tokwi Grand Char Koew Teow, Kangar',
    description: 'A highly popular Char Kway Teow hawker spot in Kangar, known for extra moist stir-fried flat noodles rich in wok-hei, topped with prawns, sprouts and eggs.',
    halal_status: 'halal'
  },
  {
    food_id: 'perlis_f4',
    state: 'Perlis',
    name: 'Kuala Perlis Seafood Restaurant, Kangar',
    description: 'A friendly local seafood dining hall offering sea-to-table catches cooked in robust butter garlic cream, hot chili, or savory southern style sweet and sour sauce.',
    halal_status: 'halal'
  },
  {
    food_id: 'perlis_f5',
    state: 'Perlis',
    name: 'Hameed Nasi Kandar, Kangar',
    description: 'A bustling, legendary Nasi Kandar restaurant in Kangar, known for its fragrant steamed rice covered in robust, spicy lamb curries and aromatic gravies.',
    halal_status: 'halal'
  },
  {
    food_id: 'perlis_f6',
    state: 'Perlis',
    name: 'Ah beng asam laksa, Kangar',
    description: 'A landmark corner stall in Kangar serving extremely fragrant, tangy sour fish mackerel broth with slippery rice noodles, garnished with mint and cucumber slices.',
    halal_status: 'non_halal'
  },
  {
    food_id: 'perlis_f7',
    state: 'Perlis',
    name: 'Kedai Khuan Bee, Kuala Perlis',
    description: 'A historic vintage local Chinese Kopitiam in Kuala Perlis, serving traditional butter-kaya charcoal grilled toasts, local rich coffees, and homey noodle dishes.',
    halal_status: 'non_halal'
  }
];
