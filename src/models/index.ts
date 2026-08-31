// ============================================================
// Dummy data (slicing stage) — mirrors prisma/schema.prisma models
// ============================================================

export interface Place {
  id: number;
  name: string;
  active: "yes" | "no";
  photo: string | null;
}

export interface Package {
  id: number;
  name: string;
  placeId: number | null;
  placeName?: string;
  facilities: (string | null)[];
  price: number;
}

export interface GalleryItem {
  id: number;
  title: string;
  placeId: number;
  placeName?: string;
  filename: string;
  locked: "yes" | "no";
}

export interface VideoItem {
  id: number;
  name: string;
  placeId: number;
  placeName?: string;
  linkCode: string;
}

export interface BlogPost {
  id: number;
  adminId: number;
  adminName?: string;
  datetime: string;
  datetimeAfter: string | null;
  title: string;
  filename: string;
  paraHeader: string;
  paraBody: string;
}

export interface Sponsor {
  id: number;
  name: string;
  description: string | null;
  filename: string;
}

export interface Testimonial {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string | null;
  date: string;
  comment: string;
  rating: number;
  active: "yes" | "no";
  note: string | null;
}

export interface User {
  id: number;
  email: string;
  phone: string | null;
  name: string;
  gender: "male" | "female" | null;
  birthDate: string | null;
  address: string | null;
  avatar: string | null;
}

export interface Admin {
  id: number;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

export interface Order {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string | null;
  dateOrder: string;
  dateSchedule: string;
  homestay: "yes" | "no";
  homestayTime: number | null;
  totalPrice: number;
  items: { id: number; packageName: string; quantity: number; price: number }[];
}

// ------------------------------------------------------------
// Seeds (from desa_wisata.sql dump + reconstructed rows)
// ------------------------------------------------------------

export const dummyPlaces: Place[] = [
  { id: 1, name: "Telaga Saat, Puncak", active: "yes", photo: null },
  { id: 2, name: "Camp Situ Patenggang", active: "yes", photo: null },
  { id: 3, name: "Waduk Jatiluhur", active: "yes", photo: null },
  { id: 4, name: "Kuningan", active: "yes", photo: null },
  { id: 5, name: "Pacitan", active: "yes", photo: null },
];

export const dummyPackages: Package[] = [
  {
    id: 1,
    name: "Paket A",
    placeId: 1,
    placeName: "Telaga Saat, Puncak",
    facilities: ["Jasa Pemandu", "Peralatan", "Asuransi", "Transportasi"],
    price: 75000,
  },
  {
    id: 2,
    name: "Paket B",
    placeId: 2,
    placeName: "Camp Situ Patenggang",
    facilities: ["Jasa Pemandu", "Peralatan", "Asuransi", "Transportasi"],
    price: 75000,
  },
  {
    id: 3,
    name: "Paket C",
    placeId: 1,
    placeName: "Telaga Saat, Puncak",
    facilities: ["Jasa Pemandu", "Peralatan", "Transportasi", null],
    price: 65000,
  },
];

export const dummyGalleries: GalleryItem[] = [
  {
    id: 101,
    title: "Sejuknya Curug Leuwi Lieuk",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    filename: "https://picsum.photos/seed/curug1/750/500",
    locked: "no",
  },
  {
    id: 102,
    title: "Lingkungan Kampung Budaya Sindang Barang",
    placeId: 2,
    placeName: "Kampung Budaya Sindang Barang",
    filename: "https://picsum.photos/seed/sindang1/750/500",
    locked: "no",
  },
  {
    id: 103,
    title: "Tarian di Kampung Budaya Sindang Barang",
    placeId: 2,
    placeName: "Kampung Budaya Sindang Barang",
    filename: "https://picsum.photos/seed/sindang2/750/500",
    locked: "yes",
  },
  {
    id: 104,
    title: "Bertandang ke Leuwi Lieuk",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    filename: "https://picsum.photos/seed/curug2/750/500",
    locked: "no",
  },
  {
    id: 105,
    title: "Pengalaman dan Harga Tiket di Curug Leuwi",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    filename: "https://picsum.photos/seed/curug3/750/500",
    locked: "yes",
  },
  {
    id: 106,
    title: "Bersama-sama ke Curug Leuwi Lieuk",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    filename: "https://picsum.photos/seed/curug4/750/500",
    locked: "no",
  },
];

export const dummyVideos: VideoItem[] = [
  {
    id: 401,
    name: "Wisata Curug Air Terjun Leuwi Lieuk & Leuwi Cepet Sentul | Bogor",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    linkCode: "goiL7aOMsjg",
  },
  {
    id: 402,
    name: "Curug Leuwi Lieuk Bogor Jawa Barat",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    linkCode: "2eQEuMV1YEA",
  },
  {
    id: 403,
    name: "Curug Leuwi Lieuk, Bogor",
    placeId: 1,
    placeName: "Curug Leuwi Lieuk",
    linkCode: "0U3sCG0FqqA",
  },
  {
    id: 404,
    name: "Kampung Budaya Sindangbarang - Sejarah dan Tradisi",
    placeId: 2,
    placeName: "Kampung Budaya Sindang Barang",
    linkCode: "UTX0WClNGY0",
  },
  {
    id: 405,
    name: "Kampung Budaya Sindangbarang",
    placeId: 2,
    placeName: "Kampung Budaya Sindang Barang",
    linkCode: "WaPKZj4LXk8",
  },
];

export const dummyBlogs: BlogPost[] = [
  {
    id: 201,
    adminId: 1,
    adminName: "Admin Sementara",
    datetime: "2020-10-25 14:27:51",
    datetimeAfter: null,
    title: "Serunya Pemandangan",
    filename: "https://picsum.photos/seed/blog1/750/420",
    paraHeader:
      "<p>Hai sahabat Dewa Bejo! Bagaimana harimu di tahun baru? Apakah bahagia, atau justru semakin stres? Jika stres melanda, segeralah merapat ke tempat kami. Karena kami selalu punya obatnya.</p>",
    paraBody:
      "<p>Selain terkenal dengan Goa Pindul dan body rafting Sungai Oya, kami juga memiliki paket wisata berupa menyusuri goa cantik di bawah tanah menggunakan ban karet. Berada dalam satu kawasan dengan Goa Pindul, objek wisata ini dikenal dengan nama Goa Tanding.</p>",
  },
  {
    id: 202,
    adminId: 1,
    adminName: "Admin Sementara",
    datetime: "2021-10-27 10:24:31",
    datetimeAfter: null,
    title: "Curug Leuwi Lieuk, Destinasi Wisata Eksotis Tak Jauh dari Ibu Kota",
    filename: "https://picsum.photos/seed/blog2/750/420",
    paraHeader:
      "<p>Meski tak jauh dari kota metropolitan Jakarta, Bogor memiliki banyak destinasi alam yang dapat dikunjungi, lho. Wisata alam yang dapat didatang bukan hanya puncak, tapi ada beragam destinasi menarik lainnya. Salah satunya adalah Curug Leuwi Lieuk.</p>",
    paraBody:
      "<p>Curug Leuwi Lieuk cocok dijadikan destinasi wisata saat penat dengan rutinitas ibu kota. Curug ini berada di wilayah yang sama dengan Curug Leuwi Hejo yang berlokasi di Cibadak, Bogor.</p><p>Meski ada di satu wilayah yang sama, Curug Leuwi Lieuk lebih jauh sekitar 300 meter ke arah timur dan jalan yang dituju lebih terjal.</p><p>Jalan yang lebih terjal dan jarak yang sedikit lebih jauh ini membuat Curug Leuwi Lieuk tak seramai Curug Leuwi Hejo.</p>",
  },
  {
    id: 203,
    adminId: 3,
    adminName: "Tania Anggra",
    datetime: "2021-12-05 08:50:54",
    datetimeAfter: "2021-12-05 08:53:10",
    title: "Menyambangi Bekas Kasepuhan Sunda di Kampung Budaya Sindang Barang",
    filename: "https://picsum.photos/seed/blog3/750/420",
    paraHeader:
      "<p>Kampung Sindang Barang diyakini sudah ada sejak abad ke-XII. Merunut latar belakang sejarahnya, terpapar dalam Babat Pajajaran dan tertulis juga dalam pantun Bogor, Sindang Barang diyakini sebagai kerajaan bawahan Prabu Siliwangi dengan Kutabarang sebagai ibukotanya.</p>",
    paraBody:
      "<p>Berjarak sekitar 5 km dari pusat Kota Bogor, Kampung Budaya Sindang Barang terletak di Desa Pasir Eurih, Kecamatan Tamansari, Kabupaten Bogor.</p><p>Sebagai perkampungan yang masih memegang teguh tradisi dan adat istiadat leluhur, bentuk bangunan rumah dibuat sedemikian rupa sehingga tampak sama dengan apa yang tertulis dalam pantun Bogor tentang Kampung Sindang Barang di masa lampau.</p><p>Panggung pementasan menjadi bagian yang sangat penting dari Kampung Budaya Sindang Barang. Berbagai kesenian asli Sunda seperti kesenian calung, berbagai tari tradisional, hingga angklung gubrag menjadi hiburan menarik yang selalu dipentaskan di kampung budaya ini.</p>",
  },
];

export const dummySponsors: Sponsor[] = [
  {
    id: 1,
    name: "Dinas Pariwisata",
    description: "Pendukung utama desa wisata",
    filename: "https://picsum.photos/seed/sponsor1/200/100",
  },
  {
    id: 2,
    name: "Bank BJB",
    description: "Mitra pembayaran",
    filename: "https://picsum.photos/seed/sponsor2/200/100",
  },
  {
    id: 3,
    name: "Travel Bogor",
    description: "Mitra perjalanan",
    filename: "https://picsum.photos/seed/sponsor3/200/100",
  },
  {
    id: 4,
    name: "Kopi Salak",
    description: "Byproduct desa",
    filename: "https://picsum.photos/seed/sponsor4/200/100",
  },
  {
    id: 5,
    name: "UMKM Pasir Eurih",
    description: "Produk lokal warga",
    filename: "https://picsum.photos/seed/sponsor5/200/100",
  },
  {
    id: 6,
    name: "Outdoor Bogor",
    description: "Sewa peralatan outdoor",
    filename: "https://picsum.photos/seed/sponsor6/200/100",
  },
];

export const dummyTestimonials: Testimonial[] = [
  {
    id: 1,
    userId: 1,
    userName: "Raihan Yusuf",
    userEmail: "raihany@gmail.com",
    userPhone: "089605567347",
    date: "2021-11-08 10:00:00",
    comment: "Pemandangannya bagus banget, pemandunya juga ramah!",
    rating: 5,
    active: "yes",
    note: null,
  },
  {
    id: 2,
    userId: 4,
    userName: "Alatas Ali",
    userEmail: "111201912121@mhs.dinus.ac.id",
    userPhone: null,
    date: "2021-11-20 09:30:00",
    comment: "Pengalaman homestay yang nyaman, kuliner lokalnya juara.",
    rating: 4,
    active: "yes",
    note: null,
  },
  {
    id: 3,
    userId: 1,
    userName: "Raihan Yusuf",
    userEmail: "raihany@gmail.com",
    userPhone: "089605567347",
    date: "2021-12-01 14:20:00",
    comment: "Parkirnya perlu diperluas saat weekend.",
    rating: 3,
    active: "no",
    note: "Menunggu perbaikan area parkir",
  },
  {
    id: 4,
    userId: 5,
    userName: "Dewi Lestari",
    userEmail: "dewi.lestari@gmail.com",
    userPhone: null,
    date: "2022-01-15 16:45:00",
    comment:
      "Sunrise di bukit desa luar biasa, bakal balik lagi bareng keluarga.",
    rating: 5,
    active: "yes",
    note: null,
  },
  {
    id: 5,
    userId: 6,
    userName: "Bima Saputra",
    userEmail: "bima.saputra@gmail.com",
    userPhone: null,
    date: "2022-02-03 11:10:00",
    comment: "Paket wisatanya lengkap dan harganya masuk akal untuk rombongan.",
    rating: 4,
    active: "yes",
    note: null,
  },
];

export const dummyUsers: User[] = [
  {
    id: 1,
    email: "raihany@gmail.com",
    phone: "0896-0556-7347",
    name: "Raihan Yusuf",
    gender: "male",
    birthDate: "2001-07-07",
    address: "Jl. Bukit Kelapa Hijau XI No.29 Semarang",
    avatar: "https://picsum.photos/seed/user1/200/200",
  },
  {
    id: 4,
    email: "111201912121@mhs.dinus.ac.id",
    phone: null,
    name: "Alatas Ali",
    gender: null,
    birthDate: null,
    address: null,
    avatar: "https://picsum.photos/seed/user2/200/200",
  },
];

export const dummyAdmins: Admin[] = [
  {
    id: 1,
    email: "adminsementara@gmail.com",
    username: "adminku",
    name: "Admin Sementara",
    avatar: "https://picsum.photos/seed/admin1/200/200",
  },
  {
    id: 2,
    email: "fabianski@gmail.com",
    username: "fabfab",
    name: "Fabianski",
    avatar: "https://picsum.photos/seed/admin2/200/200",
  },
  {
    id: 3,
    email: "taniatan@gmail.com",
    username: "taniaaaa",
    name: "Tania Anggra",
    avatar: "https://picsum.photos/seed/admin3/200/200",
  },
];

export const dummyOrders: Order[] = [
  {
    id: 2,
    userId: 1,
    userName: "Raihan Yusuf",
    userEmail: "raihany@gmail.com",
    userPhone: "0896-0556-7347",
    dateOrder: "2021-11-07 09:35:17",
    dateSchedule: "2021-11-07",
    homestay: "yes",
    homestayTime: 5,
    totalPrice: 290000,
    items: [
      { id: 3, packageName: "Paket A", quantity: 2, price: 150000 },
      { id: 4, packageName: "Paket B", quantity: 1, price: 75000 },
      { id: 5, packageName: "Paket C", quantity: 1, price: 65000 },
    ],
  },
  {
    id: 3,
    userId: 1,
    userName: "Raihan Yusuf",
    userEmail: "raihany@gmail.com",
    userPhone: "0896-0556-7347",
    dateOrder: "2021-11-18 10:53:15",
    dateSchedule: "2021-11-19",
    homestay: "yes",
    homestayTime: 2,
    totalPrice: 75000,
    items: [{ id: 6, packageName: "Paket A", quantity: 1, price: 75000 }],
  },
];
