# 📸 Fotoğraf Portföy Sitesi

Modern, minimalistik ve responsive fotoğraf portföy websitesi. Next.js, TailwindCSS ve Supabase kullanılarak geliştirilmiştir.

## ✨ Özellikler

- **📱 Responsive Tasarım:** Mobil ve desktop uyumlu
- **🎨 Modern UI:** Koyu tema, minimalistik tasarım
- **🔐 Admin Paneli:** Fotoğrafçı için özel yönetim paneli
- **📂 Fotoğraf Setleri:** Organize fotoğraf koleksiyonları
- **💬 Metin Balonları:** Fotoğraflar arasına yerleştirilebilir metinler
- **🖱️ Drag & Drop:** Sürükle-bırak ile sıralama
- **🌙 Tema Desteği:** Koyu/açık tema geçişi
- **🔍 Modal Galeri:** Tam ekran fotoğraf görüntüleme

## 🚀 Teknolojiler

- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Backend:** Supabase (Database, Auth, Storage)
- **Drag & Drop:** @dnd-kit

## 📦 Kurulum

1. **Repository'yi klonla:**
```bash
git clone https://github.com/KULLANICI_ADIN/REPO_ADI.git
cd photo-portfolio
```

2. **Bağımlılıkları yükle:**
```bash
npm install
```

3. **Environment variables oluştur:**
```bash
# .env.local dosyası oluştur
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Development server'ı başlat:**
```bash
npm run dev
```

## 🗄️ Veritabanı Kurulumu

Supabase'de aşağıdaki tabloları oluştur:

### `photosets` tablosu:
```sql
CREATE TABLE photosets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `photos` tablosu:
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID REFERENCES photosets(id) ON DELETE CASCADE,
  image_url TEXT,
  alt_text TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `text_bubbles` tablosu:
```sql
CREATE TABLE text_bubbles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES photosets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  size TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🌐 Deployment

### Vercel (Önerilen):
1. [vercel.com](https://vercel.com) adresine git
2. GitHub hesabınla giriş yap
3. "New Project" > Repository'ni seç
4. Environment variables'ları ekle
5. Deploy et!

### Netlify:
1. [netlify.com](https://netlify.com) adresine git
2. "New site from Git" > Repository'ni seç
3. Environment variables'ları ekle
4. Deploy et!

## 📱 Kullanım

### Admin Paneli:
- `/admin` - Yönetici girişi
- Fotoğraf setleri oluştur
- Fotoğraf ve metin balonu ekle
- Sürükle-bırak ile sırala

### Public Site:
- `/` - Ana sayfa (fotoğraf setleri)
- `/sets/[id]` - Galeri görüntüleme
- `/about` - Hakkında sayfası

## 🎨 Özelleştirme

- **Renkler:** `src/app/globals.css` dosyasında CSS variables
- **Tema:** `src/components/ThemeToggle.tsx`
- **Layout:** `src/app/layout.tsx`

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit et (`git commit -m 'Add amazing feature'`)
4. Push et (`git push origin feature/amazing-feature`)
5. Pull Request oluştur

---

**Geliştirici:** [Adın]
**Versiyon:** 1.0.0
