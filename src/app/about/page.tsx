"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="bg-[#23232a] border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Fotoğraf Portföyü</h1>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-gray-100 hover:text-white transition">
              Ana Sayfa
            </Link>
            <Link href="/admin" className="text-gray-100 hover:text-white transition">
              Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-[#23232a] rounded-2xl p-8 border border-gray-800">
          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-[var(--accent)] shadow-lg">
                <img
                  src="/profile.jpg"
                  alt="Fotoğrafçı Profil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if profile image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gray-700 flex items-center justify-center">
                        <div class="text-gray-400 text-center">
                          <div class="text-4xl mb-2">📸</div>
                          <div class="text-sm">Profil Fotoğrafı</div>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
            </div>

            {/* Bio Section */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">Fotoğrafçı Hakkında</h2>
              
              <div className="space-y-6 text-gray-100">
                <p className="text-lg leading-relaxed">
                  Merhaba! Ben bir fotoğraf tutkunuyum ve hayatın güzel anlarını ölümsüzleştirmeyi seviyorum. 
                  Her karede bir hikaye, her görselde bir duygu yakalamaya çalışıyorum.
                </p>
                
                <p className="leading-relaxed">
                  Fotoğrafçılık benim için sadece bir meslek değil, aynı zamanda bir tutku. 
                  Doğanın muhteşem renklerinden, insanların samimi anlarına kadar, 
                  hayatın her alanından ilham alıyorum.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Uzmanlık Alanları</h3>
                    <ul className="space-y-2 text-gray-100">
                      <li>• Portre Fotoğrafçılığı</li>
                      <li>• Doğa ve Manzara</li>
                      <li>• Sokak Fotoğrafçılığı</li>
                      <li>• Belgesel Fotoğrafçılık</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">İletişim</h3>
                    <div className="space-y-2 text-gray-100">
                      <p>📧 info@fotografci.com</p>
                      <p>📱 +90 555 123 45 67</p>
                      <p>📍 İstanbul, Türkiye</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--foreground)] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Fotoğraf Çalışmalarımı İncele →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 