# Ana Sayfa Müziği Kurulumu

## Database Schema

**ÖNEMLİ**: Bu adımı tamamlamadan ana sayfa müziği çalışmayacak!

Supabase SQL Editor'da aşağıdaki komutu çalıştırın:

```sql
-- Ana sayfa ayarları tablosu oluştur
CREATE TABLE IF NOT EXISTS homepage_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  homepage_music_url TEXT,
  homepage_music_title TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlk kaydı ekle
INSERT INTO homepage_settings (id, homepage_music_url, homepage_music_title) 
VALUES ('1', '', '') 
ON CONFLICT (id) DO NOTHING;

-- RLS politikaları (eğer RLS aktifse)
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public)
CREATE POLICY "Allow public read access" ON homepage_settings
  FOR SELECT USING (true);

-- Sadece authenticated kullanıcılar yazabilir
CREATE POLICY "Allow authenticated insert/update" ON homepage_settings
  FOR ALL USING (auth.role() = 'authenticated');
```

## Özellikler

- ✅ Ana sayfada otomatik müzik çalma
- ✅ Admin panelinden müzik yükleme
- ✅ Müzik başlığı gösterimi
- ✅ Ana sayfa müziği ve photoset müziği ayrımı
- ✅ Müzik player'da stop butonu

## Kullanım

1. **Admin Panel**: `/admin` sayfasında "Ana Sayfa Müziği Ayarları" bölümünden müzik yükleyin
2. **Ana Sayfa**: Ziyaretçiler ana sayfaya girdiğinde müzik otomatik başlar
3. **Photoset**: Photoset'e gidince ana sayfa müziği durur, photoset müziği başlar
4. **Ana Sayfaya Dönüş**: Photoset'ten ana sayfaya dönünce ana sayfa müziği tekrar başlar

## Notlar

- Ana sayfa müziği opsiyoneldir
- Müzik dosyaları Supabase Storage'da `music` bucket'ında saklanır
- Müzik player'da stop butonu ile müziği tamamen durdurabilirsiniz 