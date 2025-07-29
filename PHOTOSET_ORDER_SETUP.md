# Fotoğraf Setleri Sıralama Kurulumu

## Database Schema

Supabase SQL Editor'da aşağıdaki komutu çalıştırın:

```sql
-- photosets tablosuna order kolonu ekle
ALTER TABLE photosets ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Mevcut kayıtlar için order değerlerini güncelle
UPDATE photosets SET "order" = id::text::bigint % 1000000 WHERE "order" IS NULL;

-- Order kolonuna index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_photosets_order ON photosets("order");
```

## Özellikler

- ✅ Fotoğraf setlerini sürükle-bırak ile sıralama
- ✅ Admin panelinde drag & drop arayüzü
- ✅ Ana sayfada sıralı görüntüleme
- ✅ Database'de order bilgisi saklama
- ✅ Otomatik sıralama güncelleme

## Kullanım

1. **Admin Panel**: `/admin` sayfasında fotoğraf setlerini sürükleyip bırakın
2. **Ana Sayfa**: Sıralama otomatik olarak ana sayfada görünür
3. **Database**: Order bilgisi otomatik olarak güncellenir

## Notlar

- Order değeri 0'dan başlar
- Yeni eklenen setler en sona eklenir
- Sürükleme sırasında order değerleri otomatik güncellenir
- Ana sayfa ve admin paneli aynı sıralamayı kullanır 