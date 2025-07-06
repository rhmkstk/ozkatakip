// Veri yapisi degisiklikleri

- urun bilgisindeki Üretim tarihi sadece yil olmali
- konum bilgisi ilisliki sekilde alinmali, bulundugu alan bulundugu binadan turemeli, bir binanin birden fazla alani olabilir
- model/tipi urunun kg sini de iceriyor, bunu ayirabiliriz, kg ayri bir alan olsun, model tipi ayri bir alan (bu iki alan iliskilendirilebilir)
- location_id lowerCase yapilmali
- yedek tupler icin location yedek olarak girilmeli `(yedek-1, yedek-1)
- YSC seri no uniq olmak zorunda!

// on gosterim notlari

- konum filtresi aktiflestirilecek
- ysc no ya gore siralama eklenecek
- urun silme eklenecek
- true yerine checkbox koy

// history
- user
- ysc no
- islem tipi (bakim kaydi, dolum, degisim, diger)
- createdAt
- details

- rahmi kostik 123 YSC nolu icin 21.02.2025 12:31 tarihinde dolum kaydi olusturdu (bir sonraki dolum tarihi 21.02.2027)
- rahmi kostik 123 YSC nolu icin 21.02.2025 12:31 tarihinde degisim kaydi olusturdu (123 YSC nolu urun yedege alindi, 325 nolu tupun konumu bina1/oda2 olarak degistirildi)
- rahmi kostik 123 YSC nolu icin 21.02.2025 12:31 tarihinde bakim kaydi olusturdu (bakim kayit no: 123123xccv)


// yeni iliskili konum tablolari
 Veri Tabanı Yapısı (Supabase / PostgreSQL)
1. buildings (binalar)
id (PK)	name
1	A Binası
2	B Binası

2. rooms (odalar)
id (PK)	building_id (FK)	name
1	1	X Odası
2	1	Y Odası
3	2	Z Odası

building_id → buildings.id

3. locations (lokasyonlar / tüplerin konduğu yer)
id (PK)	room_id (FK)	number (int)
1	1	1
2	2	2
3	3	1

room_id → rooms.id