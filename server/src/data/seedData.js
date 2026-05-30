const imageUrls = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1601924638867-3ec6a48c0911?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
]

const productBlueprints = [
  ['Marseille Linen Shirt', 'Áo', 690000, 4.7, 18, 'Áo linen thoáng nhẹ, form regular, phù hợp đi làm và đi chơi.'],
  ['Noir Wide Trousers', 'Quần', 890000, 4.8, 11, 'Quần ống rộng lưng cao, vải đứng form và dễ phối đồ hằng ngày.'],
  ['Soft Knit Pullover', 'Áo', 760000, 4.6, 9, 'Áo knit mềm, giữ ấm vừa phải, thích hợp thời tiết se lạnh.'],
  ['Leather Mini Tote', 'Túi', 1290000, 4.9, 7, 'Túi tote da mịn kích thước gọn, có dây đeo chéo tháo rời.'],
  ['Minimal White Sneakers', 'Giày', 980000, 4.5, 14, 'Sneaker trắng tối giản, đệm êm và dễ kết hợp với mọi outfit.'],
  ['Silk Square Scarf', 'Phụ kiện', 420000, 4.4, 24, 'Khăn lụa vuông họa tiết cổ điển, dùng làm khăn cổ hoặc phụ kiện túi.'],
  ['Riviera Cotton Tee', 'Áo', 390000, 4.3, 34, 'Áo thun cotton dày vừa, cổ tròn, thấm hút tốt cho ngày nóng.'],
  ['Studio Cropped Blazer', 'Áo', 1390000, 4.8, 6, 'Blazer dáng crop có lớp lót mỏng, tạo phom vai gọn và hiện đại.'],
  ['Pleated Midi Skirt', 'Váy', 820000, 4.6, 13, 'Chân váy midi xếp ly nhẹ, chuyển động mềm và dễ phối với áo basic.'],
  ['Canvas Market Bag', 'Túi', 560000, 4.2, 29, 'Túi canvas rộng, quai chắc, phù hợp đi làm, đi học hoặc đi chợ cuối tuần.'],
  ['Daily Rib Tank', 'Áo', 340000, 4.1, 42, 'Áo tank rib co giãn, mặc riêng hoặc layer bên trong sơ mi.'],
  ['Tailored Beige Shorts', 'Quần', 620000, 4.4, 16, 'Quần short may đo, lưng cao, có ly trước giúp dáng gọn.'],
  ['Satin Slip Dress', 'Váy', 990000, 4.7, 8, 'Đầm slip satin mềm, dây mảnh điều chỉnh được, hợp tiệc nhẹ.'],
  ['Chunky Loafers', 'Giày', 1180000, 4.5, 10, 'Loafer đế chunky nhưng nhẹ, da mịn, dễ đi cả ngày.'],
  ['Oval Metal Sunglasses', 'Phụ kiện', 520000, 4.2, 21, 'Kính mát gọng kim loại oval, tròng chống UV400.'],
  ['Cedar Eau de Parfum', 'Nước hoa', 1450000, 4.6, 12, 'Hương gỗ tuyết tùng, tiêu hồng và xạ hương sạch, lưu hương 6-8 giờ.'],
  ['Hydra Hand Cream', 'Chăm sóc', 260000, 4.5, 35, 'Kem tay dưỡng ẩm nhanh thấm, mùi dịu và không nhờn rít.'],
  ['Washed Denim Jacket', 'Áo', 1190000, 4.6, 9, 'Áo khoác denim wash xanh nhạt, form boxy và túi trước tiện dụng.'],
  ['Relaxed Cargo Pants', 'Quần', 940000, 4.3, 17, 'Quần cargo ống suông, nhiều túi nhưng vẫn gọn khi phối đồ.'],
  ['Pearl Drop Earrings', 'Phụ kiện', 480000, 4.7, 18, 'Khuyên tai ngọc trai dáng thả, nhẹ tai và sáng da.'],
  ['Ballet Mary Janes', 'Giày', 860000, 4.4, 15, 'Giày Mary Jane mũi tròn, quai mảnh, đế thấp dễ di chuyển.'],
  ['Quilted Crossbody Bag', 'Túi', 1120000, 4.8, 5, 'Túi đeo chéo chần bông, khóa kim loại và nhiều ngăn nhỏ.'],
  ['Poplin Oversized Shirt', 'Áo', 720000, 4.4, 27, 'Sơ mi poplin oversized, bề mặt mịn và giữ phom tốt sau khi giặt.'],
  ['Straight Raw Jeans', 'Quần', 980000, 4.5, 20, 'Quần jeans ống đứng raw hem, chất denim dày vừa và ít bai.'],
  ['Lace Trim Camisole', 'Áo', 450000, 4.2, 30, 'Áo hai dây viền ren nhỏ, chất lụa nhân tạo mát và mềm.'],
  ['Wool Blend Cardigan', 'Áo', 960000, 4.7, 6, 'Cardigan len pha wool, nút vân trai, giữ ấm tốt khi trời lạnh.'],
  ['Mini A-Line Dress', 'Váy', 880000, 4.3, 14, 'Đầm chữ A dáng ngắn, cổ vuông, có khóa sau dễ mặc.'],
  ['Sport Knit Sneakers', 'Giày', 1040000, 4.1, 19, 'Sneaker knit thể thao, đế đàn hồi, hợp đi bộ nhiều.'],
  ['Thin Leather Belt', 'Phụ kiện', 390000, 4.5, 26, 'Thắt lưng da bản nhỏ, khóa kim loại tối giản, dễ chỉnh size.'],
  ['Amber Body Mist', 'Chăm sóc', 330000, 4.2, 38, 'Xịt thơm cơ thể hương amber dịu, dùng sau tắm hoặc trước khi ra ngoài.'],
  ['Marseille Linen Shirt', 'Áo', 730000, 4.6, 22, 'Phiên bản màu sọc xanh của áo linen, cùng tên để test slug trùng tên.'],
  ['Monogram Bucket Hat', 'Phụ kiện', 410000, 4.0, 23, 'Mũ bucket chất cotton canvas, logo thêu nhỏ và vành mềm.'],
  ['City Travel Backpack', 'Túi', 1350000, 4.4, 11, 'Ba lô đi làm chống nước nhẹ, có ngăn laptop 14 inch.'],
  ['Soft Lounge Joggers', 'Quần', 650000, 4.3, 25, 'Quần jogger nỉ da cá mềm, bo gấu vừa, mặc nhà hoặc dạo phố.'],
  ['Twist Front Blouse', 'Áo', 790000, 4.6, 12, 'Áo blouse vạt xoắn, tay dài nhẹ, tạo điểm nhấn ở eo.'],
  ['Organza Party Dress', 'Váy', 1520000, 4.9, 4, 'Đầm organza dự tiệc, lớp ngoài trong nhẹ, phom bồng tinh tế.'],
  ['Platform Sandals', 'Giày', 920000, 4.2, 16, 'Sandal platform quai ngang, đế êm và chiều cao vừa phải.'],
  ['Compact Card Wallet', 'Phụ kiện', 360000, 4.5, 31, 'Ví đựng thẻ da mềm, nhiều khe, bỏ túi nhỏ gọn.'],
  ['Neroli Room Spray', 'Chăm sóc', 420000, 4.1, 20, 'Xịt thơm phòng hương neroli và cam bergamot, tạo cảm giác sạch.'],
  ['Cotton Trench Coat', 'Áo', 1680000, 4.8, 7, 'Áo trench cotton dày, đai eo rời, chống gió nhẹ khi đi làm.'],
  ['Pleated Tailored Pants', 'Quần', 990000, 4.6, 13, 'Quần tây xếp ly trước, lưng vừa, hợp áo sơ mi và blazer.'],
  ['Sequin Evening Top', 'Áo', 870000, 4.0, 5, 'Áo sequin dự tiệc, lớp lót mềm, ánh sáng nổi bật buổi tối.'],
  ['Half Moon Shoulder Bag', 'Túi', 1180000, 4.7, 9, 'Túi vai dáng bán nguyệt, da mịn và dây đeo chỉnh được.'],
  ['Suede Ankle Boots', 'Giày', 1490000, 4.4, 8, 'Boot cổ thấp da lộn, gót vuông chắc, hợp mùa thu đông.'],
  ['Cashmere Touch Scarf', 'Phụ kiện', 680000, 4.6, 18, 'Khăn choàng mềm như cashmere, bản rộng, giữ ấm cổ vai.'],
  ['Rose Cleanser Gel', 'Chăm sóc', 290000, 4.2, 33, 'Gel rửa mặt hương hoa hồng nhẹ, làm sạch dịu và không khô căng.'],
  ['Boxy Utility Vest', 'Áo', 840000, 4.1, 10, 'Gile utility nhiều túi, form boxy, phối tốt với áo thun basic.'],
  ['Wrap Knit Dress', 'Váy', 1150000, 4.7, 6, 'Đầm knit vạt đắp, co giãn tốt, tôn eo và dễ mặc.'],
  ['Retro Runner Shoes', 'Giày', 1090000, 4.5, 17, 'Giày runner phong cách retro, phối da lộn và mesh thoáng khí.'],
  ['Gold Chain Necklace', 'Phụ kiện', 540000, 4.3, 28, 'Dây chuyền xích mạ vàng, độ dài vừa, hợp layer nhiều vòng.'],
]

const generatedProductNames = [
  ['Linen Camp Shirt', 'Áo', 640000, 'Sơ mi camp collar vải linen pha cotton, thoáng và ít nhăn.'],
  ['Relaxed Oxford Shirt', 'Áo', 680000, 'Sơ mi oxford form rộng vừa, cổ đứng và dễ mặc quanh năm.'],
  ['Essential Crew Tee', 'Áo', 320000, 'Áo thun cổ tròn cotton compact, bề mặt mịn và dày dặn.'],
  ['Modal Long Sleeve', 'Áo', 450000, 'Áo dài tay modal mềm, co giãn nhẹ và ôm vừa người.'],
  ['Structured Vest Top', 'Áo', 740000, 'Áo vest không tay dáng gọn, hợp phối layer công sở.'],
  ['Tailored Cigarette Pants', 'Quần', 860000, 'Quần cigarette cạp vừa, ống đứng gọn và tôn dáng.'],
  ['Drawstring Linen Pants', 'Quần', 780000, 'Quần linen dây rút, nhẹ, thoải mái cho ngày nóng.'],
  ['Washed Straight Jeans', 'Quần', 920000, 'Jeans ống đứng wash xanh cổ điển, chất denim mềm dần sau khi mặc.'],
  ['Utility Parachute Pants', 'Quần', 890000, 'Quần parachute nhẹ, nhiều túi và dây chỉnh gấu.'],
  ['Soft Pleated Skort', 'Váy', 760000, 'Skort xếp ly có quần trong, tiện di chuyển và dễ phối.'],
  ['Square Neck Midi Dress', 'Váy', 1080000, 'Đầm midi cổ vuông, eo nhẹ, phù hợp đi làm và tiệc nhẹ.'],
  ['Rib Knit Maxi Dress', 'Váy', 1160000, 'Đầm maxi knit gân, co giãn tốt, dáng dài thanh lịch.'],
  ['Classic Court Sneakers', 'Giày', 990000, 'Sneaker court tối giản, da mịn và đế cao su bám tốt.'],
  ['Soft Strap Sandals', 'Giày', 720000, 'Sandal quai mềm, đệm êm, hợp đi bộ cuối tuần.'],
  ['Pointed Slingback Heels', 'Giày', 1180000, 'Giày slingback mũi nhọn, gót thấp dễ đi cả ngày.'],
  ['Minimal Hobo Bag', 'Túi', 1250000, 'Túi hobo da mềm, khoang rộng và dây vai bản vừa.'],
  ['Nylon Pocket Tote', 'Túi', 690000, 'Túi tote nylon chống nước nhẹ, có nhiều túi phụ.'],
  ['Mini Phone Crossbody', 'Túi', 580000, 'Túi đeo điện thoại nhỏ gọn, kèm ngăn thẻ tiện dụng.'],
  ['Silk Hair Ribbon', 'Phụ kiện', 260000, 'Ruy băng lụa buộc tóc hoặc trang trí túi.'],
  ['Matte Hoop Earrings', 'Phụ kiện', 390000, 'Khuyên hoop mạ mờ, nhẹ tai và dễ phối mỗi ngày.'],
  ['Slim Metal Watch', 'Phụ kiện', 1450000, 'Đồng hồ mặt nhỏ, dây kim loại mảnh, phong cách tối giản.'],
  ['Lavender Pillow Mist', 'Chăm sóc', 360000, 'Xịt thơm gối hương lavender dịu, hỗ trợ thư giãn buổi tối.'],
  ['Citrus Body Lotion', 'Chăm sóc', 420000, 'Sữa dưỡng thể hương cam chanh, thấm nhanh và không bết.'],
  ['Musk Solid Perfume', 'Nước hoa', 620000, 'Nước hoa khô hương musk sạch, nhỏ gọn để mang theo.'],
]

const generatedProductBlueprints = Array.from({ length: 72 }, (_, index) => {
  const [name, category, basePrice, description] = generatedProductNames[index % generatedProductNames.length]
  const variantNames = ['Ivory', 'Black', 'Sage', 'Navy', 'Mocha', 'Stone']
  const variant = variantNames[index % variantNames.length]
  const rating = Number((4 + ((index * 7) % 10) / 10).toFixed(1))
  const stock = ((index * 9) % 44) + 2
  const price = basePrice + ((index % 5) * 40000)

  return [
    `${variant} ${name}`,
    category,
    price,
    Math.min(4.9, rating),
    stock,
    `${description} Phiên bản màu ${variant.toLowerCase()} dùng để test catalog số lượng lớn.`,
  ]
})

const allProductBlueprints = [...productBlueprints, ...generatedProductBlueprints]

export const seedProducts = allProductBlueprints.map(([name, category, price, rating, stock, description], index) => ({
  legacyId: index + 1,
  name,
  category,
  price,
  rating,
  stock,
  image: imageUrls[index % imageUrls.length],
  description,
}))

const baseSeedUsers = [
  {
    name: 'Admin Test',
    email: 'test@gmail.com',
    password: '123456',
    phone: '0901000001',
    address: '12 Le Loi, Quan 1, TP.HCM',
    role: 'admin',
  },
  {
    name: 'Minh Anh',
    email: 'minhanh@example.com',
    password: '123456',
    phone: '0902000001',
    address: '22 Nguyen Trai, Quan 5, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Quang Huy',
    email: 'quanghuy@example.com',
    password: '123456',
    phone: '0902000002',
    address: '18 Cach Mang Thang 8, Quan 3, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Thanh Nga',
    email: 'thanhnga@example.com',
    password: '123456',
    phone: '0902000003',
    address: '45 Tran Hung Dao, Quan 1, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Hoang Nam',
    email: 'hoangnam@example.com',
    password: '123456',
    phone: '0902000004',
    address: '9 Phan Xich Long, Phu Nhuan, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Linh Chi',
    email: 'linhchi@example.com',
    password: '123456',
    phone: '0902000005',
    address: '33 Nguyen Van Cu, Quan 5, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Bao Tran',
    email: 'baotran@example.com',
    password: '123456',
    phone: '0902000006',
    address: '77 Vo Van Tan, Quan 3, TP.HCM',
    role: 'customer',
  },
  {
    name: 'Gia Han',
    email: 'giahan@example.com',
    password: '123456',
    phone: '0902000007',
    address: '101 Dien Bien Phu, Binh Thanh, TP.HCM',
    role: 'customer',
  },
]

const generatedUsers = [
  'Mai Phuong',
  'Duc Anh',
  'Ngoc Linh',
  'Tuan Kiet',
  'Ha Vy',
  'Kim Ngan',
  'Anh Thu',
  'Quoc Bao',
  'Phuong Nhi',
  'Hai Dang',
  'Yen Nhi',
  'Gia Bao',
  'Thu Ha',
  'Hoai Nam',
  'Thao My',
  'Dang Khoa',
  'Cam Tu',
  'Nhat Minh',
].map((name, index) => ({
  name,
  email: `customer${String(index + 1).padStart(2, '0')}@example.com`,
  password: '123456',
  phone: `091${String(index + 1).padStart(7, '0')}`,
  address: `${12 + index} pho ${['Trang Thi', 'Ba Trieu', 'Ly Thuong Kiet', 'Nguyen Du', 'Kim Ma', 'Hue'][index % 6]}, Ha Noi`,
  role: 'customer',
}))

export const seedUsers = [...baseSeedUsers, ...generatedUsers]

const baseSeedReviews = [
  { productId: 1, userEmail: 'minhanh@example.com', name: 'Minh Anh', rating: 5, comment: 'Chất vải mát, form đẹp hơn mong đợi.' },
  { productId: 2, userEmail: 'quanghuy@example.com', name: 'Quang Huy', rating: 5, comment: 'Mặc đi làm rất lịch sự, giao hàng nhanh.' },
  { productId: 4, userEmail: 'thanhnga@example.com', name: 'Thanh Nga', rating: 4, comment: 'Túi đẹp, đường may chắc, màu bên ngoài hơi trầm hơn ảnh.' },
  { productId: 8, userEmail: 'linhchi@example.com', name: 'Linh Chi', rating: 5, comment: 'Blazer lên dáng rất gọn, chất vải đứng.' },
  { productId: 16, userEmail: 'baotran@example.com', name: 'Bao Tran', rating: 4, comment: 'Mùi thơm sạch, dùng đi làm rất hợp.' },
  { productId: 31, userEmail: 'giahan@example.com', name: 'Gia Han', rating: 5, comment: 'Tên trùng nhưng màu sọc khác, slug vẫn mở đúng sản phẩm.' },
  { productId: 36, userEmail: 'thanhnga@example.com', name: 'Thanh Nga', rating: 5, comment: 'Đầm dự tiệc rất nổi bật, size chuẩn.' },
  { productId: 44, userEmail: 'hoangnam@example.com', name: 'Hoang Nam', rating: 4, comment: 'Boot chắc chân, màu da lộn đẹp.' },
]

const reviewComments = [
  'Đóng gói cẩn thận, sản phẩm đúng mô tả.',
  'Chất liệu ổn, màu bên ngoài đẹp hơn ảnh.',
  'Form dễ mặc, tôi sẽ mua thêm màu khác.',
  'Giao hàng nhanh, size tư vấn khá chuẩn.',
  'Đường may chắc, cảm giác dùng rất bền.',
  'Giá hợp lý so với chất lượng.',
  'Sản phẩm phù hợp đi làm hằng ngày.',
  'Màu đẹp, phối đồ rất tiện.',
]

const reviewCustomers = seedUsers.filter((user) => user.role === 'customer')
const generatedReviews = Array.from({ length: 96 }, (_, index) => {
  const user = reviewCustomers[index % reviewCustomers.length]
  return {
    productId: ((index * 5) % allProductBlueprints.length) + 1,
    userEmail: user.email,
    name: user.name,
    rating: (index % 5) + 1,
    comment: `${reviewComments[index % reviewComments.length]} #${String(index + 1).padStart(3, '0')}`,
  }
})

export const seedReviews = [...baseSeedReviews, ...generatedReviews]

const baseSeedContacts = [
  {
    name: 'Minh Anh',
    email: 'minhanh@example.com',
    phone: '0902000001',
    topic: 'Tư vấn sản phẩm',
    message: 'Tôi cần tư vấn size cho áo linen và blazer.',
    status: 'new',
    daysAgo: 2,
  },
  {
    name: 'Quang Huy',
    email: 'quanghuy@example.com',
    phone: '0902000002',
    topic: 'Hỗ trợ đơn hàng',
    message: 'Tôi muốn đổi địa chỉ nhận hàng cho đơn gần nhất.',
    status: 'processing',
    daysAgo: 5,
  },
  {
    name: 'Thanh Nga',
    email: 'thanhnga@example.com',
    phone: '0902000003',
    topic: 'Đổi trả',
    message: 'Tôi muốn hỏi chính sách đổi size giày.',
    status: 'done',
    daysAgo: 12,
  },
  {
    name: 'Gia Han',
    email: 'giahan@example.com',
    phone: '0902000007',
    topic: 'Thanh toán',
    message: 'Website có hỗ trợ thanh toán khi nhận hàng không?',
    status: 'new',
    daysAgo: 1,
  },
]

const contactTopics = ['Tư vấn sản phẩm', 'Hỗ trợ đơn hàng', 'Đổi trả', 'Thanh toán']
const contactMessages = [
  'Tôi cần tư vấn chọn size cho sản phẩm mới.',
  'Tôi muốn kiểm tra tình trạng đơn hàng.',
  'Tôi cần hỗ trợ đổi màu sản phẩm.',
  'Tôi muốn hỏi thêm về phương thức thanh toán.',
  'Tôi cần xuất hóa đơn cho đơn mua gần đây.',
  'Sản phẩm còn hàng tại cửa hàng Hà Nội không?',
]

const generatedContacts = reviewCustomers.slice(0, 18).map((user, index) => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  topic: contactTopics[index % contactTopics.length],
  message: `${contactMessages[index % contactMessages.length]} Mã yêu cầu TEST-${String(index + 1).padStart(3, '0')}.`,
  status: ['new', 'processing', 'done'][index % 3],
  daysAgo: index + 1,
}))

export const seedContacts = [...baseSeedContacts, ...generatedContacts]

const baseSeedCarts = [
  { userEmail: 'minhanh@example.com', items: [{ productId: 1, quantity: 1 }, { productId: 15, quantity: 2 }] },
  { userEmail: 'quanghuy@example.com', items: [{ productId: 5, quantity: 1 }, { productId: 24, quantity: 1 }] },
  { userEmail: 'linhchi@example.com', items: [{ productId: 13, quantity: 1 }, { productId: 20, quantity: 1 }] },
]

const generatedCarts = reviewCustomers.slice(3, 18).map((user, index) => ({
  userEmail: user.email,
  items: [
    { productId: ((index * 4) % allProductBlueprints.length) + 1, quantity: (index % 2) + 1 },
    { productId: ((index * 9 + 6) % allProductBlueprints.length) + 1, quantity: 1 },
  ],
}))

export const seedCarts = [...baseSeedCarts, ...generatedCarts]

const orderUsers = seedUsers.filter((user) => user.role === 'customer')
const orderStatuses = ['confirmed', 'paid', 'shipping', 'completed', 'cancelled']
const paymentMethods = ['Thanh toán khi nhận hàng', 'Chuyển khoản ngân hàng', 'Thẻ nội địa / Visa']

export const seedOrderTemplates = Array.from({ length: 160 }, (_, index) => {
  const user = orderUsers[index % orderUsers.length]
  const firstProductId = ((index * 3) % allProductBlueprints.length) + 1
  const secondProductId = ((index * 7 + 5) % allProductBlueprints.length) + 1
  const thirdProductId = ((index * 11 + 9) % allProductBlueprints.length) + 1
  const items = [
    { productId: firstProductId, quantity: (index % 3) + 1 },
    { productId: secondProductId, quantity: (index % 2) + 1 },
  ]

  if (index % 4 === 0) {
    items.push({ productId: thirdProductId, quantity: 1 })
  }

  return {
    orderCode: `MRS-TEST-${String(index + 1).padStart(3, '0')}`,
    userEmail: user.email,
    status: orderStatuses[index % orderStatuses.length],
    payment: paymentMethods[index % paymentMethods.length],
    daysAgo: index * 2 + (index % 9),
    items,
  }
})
