"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";

interface Photo {
  id: string;
  image_url: string;
  alt_text: string;
  order: number;
  created_at: string;
}

interface PhotoSet {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  music_url?: string;
  created_at: string;
}

interface TextBubble {
  id: string;
  set_id: string;
  content: string;
  size: 'small' | 'medium' | 'large';
  order: number;
  created_at: string;
}

interface GalleryItem {
  id: string;
  type: 'photo' | 'textBubble';
  photo?: Photo;
  textBubble?: TextBubble;
  order: number;
}

export default function PhotoGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentTrack, play, stop, forceStop } = useMusic();
  const [photoSet, setPhotoSet] = useState<PhotoSet | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [textBubbles, setTextBubbles] = useState<TextBubble[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPhotoSetAndPhotos(params.id as string);
    }
  }, [params.id]);

  // Handle music auto-play when photo set changes
  useEffect(() => {
    if (photoSet) {
      if (photoSet.music_url) {
        // Set the track first
        setCurrentTrack({
          id: photoSet.id,
          title: photoSet.title,
          audioUrl: photoSet.music_url
        });
        
        // Wait a bit before playing to ensure audio is loaded
        setTimeout(() => {
          play();
        }, 100);
      } else {
        stop();
      }
    }

    // Cleanup when component unmounts or photo set changes
    return () => {
      // Only stop if we're leaving this specific photo set
      if (photoSet && photoSet.music_url) {
        stop();
      }
    };
  }, [photoSet]); // Remove music functions from dependencies

  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Force stop music when leaving the page
      forceStop();
    };
  }, []); // Remove forceStop from dependencies

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === "ArrowLeft") {
          goToPrevious();
        } else if (e.key === "ArrowRight") {
          goToNext();
        } else if (e.key === "Escape") {
          setSelectedPhotoIndex(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  const fetchPhotoSetAndPhotos = async (setId: string) => {
    // Fetch photo set details
    const { data: setData, error: setError } = await supabase
      .from("photosets")
      .select("*")
      .eq("id", setId)
      .single();

    if (setError || !setData) {
      router.push("/");
      return;
    }

    setPhotoSet(setData as PhotoSet);

    // Fetch photos for this set
    const { data: photosData, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("set_id", setId)
      .order("order", { ascending: true });

    // Fetch text bubbles for this set
    const { data: textBubblesData, error: textBubblesError } = await supabase
      .from("text_bubbles")
      .select("*")
      .eq("set_id", setId)
      .order("order", { ascending: true });

    if (!photosError && photosData) {
      setPhotos(photosData as Photo[]);
    }

    if (!textBubblesError && textBubblesData) {
      setTextBubbles(textBubblesData as TextBubble[]);
    }

    // Combine photos and text bubbles into gallery items
    const items: GalleryItem[] = [];
    
    // Add photos
    photosData?.forEach(photo => {
      items.push({
        id: photo.id,
        type: 'photo',
        photo: photo,
        order: photo.order
      });
    });

    // Add text bubbles
    textBubblesData?.forEach(bubble => {
      items.push({
        id: bubble.id,
        type: 'textBubble',
        textBubble: bubble,
        order: bubble.order
      });
    });

    // Sort by order
    items.sort((a, b) => a.order - b.order);
    setGalleryItems(items);

    setLoading(false);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!photoSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-white text-lg">Fotoğraf seti bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <nav className="bg-[#23232a]/90 backdrop-blur-sm border-b border-gray-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-white hover:text-[var(--accent)] transition-colors flex items-center gap-2"
          >
            ← Ana Sayfaya Dön
          </Link>
          <div className="text-center">
            <h1 className="text-white text-lg font-semibold">{photoSet.title}</h1>
            <p className="text-gray-300 text-sm">{photos.length} fotoğraf, {textBubbles.length} metin balonu</p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Photo Grid */}
      <div className="max-w-4xl mx-auto p-6">
        {galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">Bu sette henüz içerik yok</div>
            <Link
              href="/"
              className="text-[var(--accent)] hover:text-white transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                {item.type === 'photo' && item.photo && (
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      // Find photo index in photos array
                      const photoIndex = photos.findIndex(p => p.id === item.photo!.id);
                      setSelectedPhotoIndex(photoIndex);
                    }}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-[#23232a] border border-gray-800 hover:border-[var(--accent)] transition-all duration-500">
                      <img
                        src={item.photo.image_url}
                        alt={item.photo.alt_text || `${photoSet.title} - Fotoğraf ${index + 1}`}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      
                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm">
                            Detaylı Görüntüle
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Photo Info */}
                    {item.photo.alt_text && (
                      <div className="mt-3 p-4 bg-[#23232a] rounded-lg border border-gray-800">
                        <p className="text-gray-300 text-sm">{item.photo.alt_text}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {item.type === 'textBubble' && item.textBubble && (
                  <div className="flex justify-center my-8">
                    <div className={`bg-[#23232a] rounded-2xl border border-gray-800 p-6 shadow-lg ${
                      (item.textBubble.size || 'medium') === 'small' ? 'max-w-2xl' :
                      (item.textBubble.size || 'medium') === 'medium' ? 'max-w-4xl' : 'max-w-6xl'
                    }`}>
                      <p className={`text-gray-100 leading-relaxed ${
                        (item.textBubble.size || 'medium') === 'small' ? 'text-lg' :
                        (item.textBubble.size || 'medium') === 'medium' ? 'text-xl' : 'text-2xl'
                      }`}>
                        {item.textBubble.content}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Full Screen View */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div className="relative w-full max-w-6xl">
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="absolute top-4 right-4 z-40 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              >
                ✕
              </button>

              {/* Navigation Buttons */}
              {selectedPhotoIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                >
                  ←
                </button>
              )}
              {selectedPhotoIndex < photos.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                >
                  →
                </button>
              )}

              {/* Photo */}
              <motion.div
                key={selectedPhotoIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={photos[selectedPhotoIndex].image_url}
                  alt={photos[selectedPhotoIndex].alt_text || photoSet.title}
                  className="max-h-[80vh] max-w-full object-contain rounded-lg"
                  draggable={false}
                />
              </motion.div>

              {/* Photo Info */}
              {photos[selectedPhotoIndex].alt_text && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg max-w-md text-center">
                  <p className="text-sm">{photos[selectedPhotoIndex].alt_text}</p>
                </div>
              )}

              {/* Photo Counter */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {selectedPhotoIndex + 1} / {photos.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 