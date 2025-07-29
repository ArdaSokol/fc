"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ThemeToggle";
import { useMusic } from "@/contexts/MusicContext";

interface PhotoSet {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  music_url?: string;
  created_at: string;
}

interface HomePageSettings {
  id: string;
  homepage_music_url?: string;
  homepage_music_title?: string;
  updated_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const { stop, forceStop, setCurrentTrack, play } = useMusic();
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [homePageSettings, setHomePageSettings] = useState<HomePageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    fetchPhotoSets();
    fetchHomePageSettings();
  }, []); // Remove all dependencies to prevent infinite loop



  const fetchPhotoSets = async () => {
    const { data, error } = await supabase
      .from("photosets")
      .select("*")
      .order("order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPhotoSets(data as PhotoSet[]);
    }
    setLoading(false);
  };

  const fetchHomePageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist or no rows - this is normal for new setup
          console.log('Homepage settings table not found or empty - this is normal for new setup');
          return;
        }
        console.error('Error fetching homepage settings:', error);
        return;
      }
      
      if (data) {
        setHomePageSettings(data);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hidden audio element for homepage music */}
      {homePageSettings?.homepage_music_url && (
        <audio
          id="homepage-audio"
          src={homePageSettings.homepage_music_url}
          preload="auto"
          onCanPlay={() => {
            if (!musicStarted && homePageSettings.homepage_music_url) {
              setCurrentTrack({
                id: 'homepage',
                title: homePageSettings.homepage_music_title || 'Ana Sayfa Müziği',
                audioUrl: homePageSettings.homepage_music_url
              });
              setTimeout(() => {
                play();
                setMusicStarted(true);
              }, 500);
            }
          }}
        />
      )}
      
      {/* Navigation */}
      <nav className="bg-[#23232a]/90 backdrop-blur-sm border-b border-gray-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">F.Ç.</h1>
          <div className="flex gap-4 items-center">
            <Link href="/about" className="text-gray-100 hover:text-white transition">
              Hakkında
            </Link>
            <Link href="/admin" className="text-gray-100 hover:text-white transition">
              Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto p-6 pt-12">
        <div className="text-center mb-12">
        </div>
      </div>

      {/* Masonry Grid */}
      {photoSets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">Henüz fotoğraf seti eklenmemiş</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {photoSets.map((set, index) => (
              <Link
                key={set.id}
                href={`/sets/${set.id}`}
                className="group block break-inside-avoid mb-4"
              >
                <div className="relative overflow-hidden rounded-2xl bg-[#23232a] border border-gray-800 hover:border-[var(--accent)] transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--accent)]/20">
                  {/* Image Container with Dynamic Aspect Ratios */}
                  <div className={`relative overflow-hidden ${
                    index % 4 === 0 ? 'aspect-[4/5]' : 
                    index % 4 === 1 ? 'aspect-[3/4]' : 
                    index % 4 === 2 ? 'aspect-[5/4]' : 'aspect-square'
                  }`}>
                    {set.cover_image_url ? (
                      <img
                        src={set.cover_image_url}
                        alt={set.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <div className="text-4xl mb-2">📸</div>
                          <div className="text-sm">Kapak Görseli Yok</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-end">
                      <div className="p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-xl font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {set.title}
                        </h3>
                        <p className="text-gray-200 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          {set.description}
                        </p>
                        <div className="text-xs text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                          {new Date(set.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#23232a] border-t border-gray-800 p-8 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 mb-4">
            F.Ç.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/about" className="text-gray-300 hover:text-white transition">
              Hakkında
            </Link>
            <Link href="/admin" className="text-gray-300 hover:text-white transition">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
