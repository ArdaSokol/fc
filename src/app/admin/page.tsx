"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '@/components/SortableItem';

interface PhotoSet {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  created_at: string;
}

interface Photo {
  id: string;
  set_id: string;
  image_url: string;
  alt_text: string;
  order: number;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [form, setForm] = useState({ title: "", description: "", cover_image_url: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryUploading, setGalleryUploading] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, Photo[]>>({});
  const [textBubbles, setTextBubbles] = useState<Record<string, TextBubble[]>>({});
  const [combinedItems, setCombinedItems] = useState<Record<string, Array<{
    id: string;
    type: 'photo' | 'textBubble';
    data: Photo | TextBubble;
    order: number;
  }>>>({});
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const [newTextBubble, setNewTextBubble] = useState<Record<string, { content: string; size: 'small' | 'medium' | 'large' }>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      console.log("Current user:", data.user); // Debug için
      if (!data.user) {
        console.log("No user found, redirecting to login"); // Debug için
        router.replace("/admin/login");
      } else {
        console.log("User found:", data.user.email); // Debug için
        setUser(data.user as { id: string; email?: string });
        fetchPhotoSets();
      }
      setLoading(false);
    };
    getUser();
    // eslint-disable-next-line
  }, [router]);

  const fetchPhotoSets = async () => {
    const { data, error } = await supabase
      .from("photosets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPhotoSets(data as PhotoSet[]);
      // Fetch photos and text bubbles for each set
      for (const set of data) {
        fetchPhotos(set.id);
        fetchTextBubbles(set.id);
      }
    }
  };

  // Combined fetch function for a set
  const fetchSetContent = async (setId: string) => {
    await fetchPhotos(setId);
    await fetchTextBubbles(setId);
    updateCombinedItems(setId);
  };

  // Update combined items for a set
  const updateCombinedItems = (setId: string) => {
    const photos = galleryPhotos[setId] || [];
    const bubbles = textBubbles[setId] || [];
    
    const items: Array<{
      id: string;
      type: 'photo' | 'textBubble';
      data: Photo | TextBubble;
      order: number;
    }> = [];
    
    // Add photos
    photos.forEach(photo => {
      items.push({
        id: photo.id,
        type: 'photo',
        data: photo,
        order: photo.order
      });
    });
    
    // Add text bubbles
    bubbles.forEach(bubble => {
      items.push({
        id: bubble.id,
        type: 'textBubble',
        data: bubble,
        order: bubble.order
      });
    });
    
    // Sort by order
    items.sort((a, b) => a.order - b.order);
    setCombinedItems(prev => ({ ...prev, [setId]: items }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data, error } = await supabase.storage.from("covers").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setError("Yükleme hatası: " + error.message);
      setUploading(false);
      return;
    }
    const url = supabase.storage.from("covers").getPublicUrl(fileName).data.publicUrl;
    setForm(f => ({ ...f, cover_image_url: url }));
    setCoverPreview(url);
    setUploading(false);
  };

  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    const { error } = await supabase.from("photosets").insert([
      { ...form }
    ]);
    if (error) setError(error.message);
    setForm({ title: "", description: "", cover_image_url: "" });
    setFormLoading(false);
    fetchPhotoSets();
  };

  // Fetch photos for a set
  const fetchPhotos = async (setId: string) => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("set_id", setId)
      .order("order", { ascending: true });
    if (!error && data) {
      setGalleryPhotos((prev) => ({ ...prev, [setId]: data as Photo[] }));
    }
  };

  // Handle gallery file upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, setId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGalleryUploading(setId);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${setId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError("Fotoğraf yükleme hatası: " + uploadError.message);
        continue;
      }
      const url = supabase.storage.from("photos").getPublicUrl(fileName).data.publicUrl;
      const alt_text = altTexts[file.name] || "";
      const { error: insertError } = await supabase.from("photos").insert([
        { set_id: setId, image_url: url, alt_text }
      ]);
      if (insertError) {
        setError("Veritabanı hatası: " + insertError.message);
      }
    }
    setGalleryUploading(null);
    await fetchSetContent(setId);
  };

  // Add delete photo handler
  const handleDeletePhoto = async (photoId: string, setId: string, imageUrl: string) => {
    // Remove from storage
    const path = imageUrl.split("/storage/v1/object/public/photos/")[1];
    if (path) {
      await supabase.storage.from("photos").remove([path]);
    }
    // Remove from DB
    await supabase.from("photos").delete().eq("id", photoId);
    await fetchSetContent(setId);
  };



  // Add delete set handler
  const handleDeleteSet = async (setId: string) => {
    if (confirm("Bu fotoğraf setini silmek istediğinizden emin misiniz?")) {
      // Delete all photos in the set first
      await supabase.from("photos").delete().eq("set_id", setId);
      // Delete the set
      await supabase.from("photosets").delete().eq("id", setId);
      fetchPhotoSets();
    }
  };

  // Add update cover image handler
  const handleUpdateCover = async (setId: string, file: File) => {
    setUploading(true);
    setError("");
    const fileExt = file.name.split('.').pop();
    const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("covers").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setError("Yükleme hatası: " + uploadError.message);
      setUploading(false);
      return;
    }
    const url = supabase.storage.from("covers").getPublicUrl(fileName).data.publicUrl;
    const { error: updateError } = await supabase.from("photosets").update({ cover_image_url: url }).eq("id", setId);
    if (updateError) {
      setError("Güncelleme hatası: " + updateError.message);
    }
    setUploading(false);
    fetchPhotoSets();
  };

  // Fetch text bubbles for a set
  const fetchTextBubbles = async (setId: string) => {
    const { data, error } = await supabase
      .from("text_bubbles")
      .select("*")
      .eq("set_id", setId)
      .order("order", { ascending: true });
    if (!error && data) {
      setTextBubbles((prev) => ({ ...prev, [setId]: data as TextBubble[] }));
    }
  };

  // Add text bubble handler
  const handleAddTextBubble = async (setId: string) => {
    const bubbleData = newTextBubble[setId];
    if (!bubbleData?.content?.trim()) return;

    const currentItems = combinedItems[setId] || [];
    const newOrder = currentItems.length;

    const { error } = await supabase.from("text_bubbles").insert([
      { 
        set_id: setId, 
        content: bubbleData.content.trim(), 
        size: bubbleData.size || 'medium',
        order: newOrder 
      }
    ]);
    
    if (error) {
      setError("Metin balonu ekleme hatası: " + error.message);
    } else {
      setNewTextBubble((prev) => ({ 
        ...prev, 
        [setId]: { content: "", size: 'medium' } 
      }));
      await fetchSetContent(setId);
    }
  };

  // Delete text bubble handler
  const handleDeleteTextBubble = async (bubbleId: string, setId: string) => {
    await supabase.from("text_bubbles").delete().eq("id", bubbleId);
    await fetchSetContent(setId);
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent, setId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const items = combinedItems[setId] || [];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over?.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setCombinedItems(prev => ({ ...prev, [setId]: newItems }));

      // Update order in database for all items
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (item.type === 'photo') {
          await supabase.from("photos").update({ order: i }).eq("id", item.id);
        } else if (item.type === 'textBubble') {
          await supabase.from("text_bubbles").update({ order: i }).eq("id", item.id);
        }
      }
      
      // Refresh content to ensure correct order
      await fetchSetContent(setId);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 p-8">
      <div className="w-full max-w-7xl flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-4">Yönetici Paneli</h1>
        <div className="flex gap-4 items-center">
          <Link
            href="/"
            className="text-gray-100 hover:text-white transition-colors px-3 py-2 rounded bg-[#1a1a1a] border border-gray-700 hover:border-gray-600"
          >
            Ana Sayfaya Dön
          </Link>
          <ThemeToggle />
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/admin/login");
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
      <form onSubmit={handleAddSet} className="w-full max-w-md bg-[#23232a] rounded-xl shadow p-6 flex flex-col gap-4 border border-gray-800">
        <h2 className="text-xl font-semibold mb-2 text-white">Yeni Fotoğraf Seti Ekle</h2>
        <input
          name="title"
          value={form.title}
          onChange={handleFormChange}
          placeholder="Set Başlığı"
          required
          className="px-3 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white placeholder-gray-400"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleFormChange}
          placeholder="Açıklama"
          required
          className="px-3 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white placeholder-gray-400"
        />
        <div>
          <label className="block mb-1 font-medium text-gray-100">Kapak Görseli</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-[var(--foreground)] hover:file:opacity-90 bg-[#1a1a1a] border border-gray-700 rounded"
            disabled={uploading}
          />
          {uploading && <div className="text-xs text-gray-300 mt-1">Yükleniyor...</div>}
          {coverPreview && (
            <img src={coverPreview} alt="Kapak önizleme" className="mt-2 w-32 h-32 object-cover rounded border border-gray-700" />
          )}
        </div>
        <button
          type="submit"
          disabled={formLoading || uploading}
          className="w-full py-2 rounded bg-[var(--accent)] text-[var(--foreground)] font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {formLoading ? "Ekleniyor..." : "Seti Ekle"}
        </button>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      </form>
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Fotoğraf Setleri</h2>
        <ul className="flex flex-col gap-6">
          {photoSets.map(set => (
            <li key={set.id} className="flex flex-col gap-2 bg-[#23232a] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-4">
                {set.cover_image_url ? (
                  <img src={set.cover_image_url} alt={set.title} className="w-20 h-20 object-cover rounded-md border shadow" />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-gray-700 text-gray-300 rounded-md border text-xs">Yok</div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg text-white">{set.title}</div>
                  <div className="text-gray-100 text-sm line-clamp-2">{set.description}</div>
                  <div className="text-xs text-gray-300 mt-1">{new Date(set.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpdateCover(set.id, file);
                    }}
                    className="hidden"
                    id={`cover-${set.id}`}
                  />
                  <label
                    htmlFor={`cover-${set.id}`}
                    className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 border border-blue-800 text-white cursor-pointer"
                    title="Kapak Görselini Güncelle"
                  >
                    Kapak Güncelle
                  </label>
                  <button
                    onClick={() => handleDeleteSet(set.id)}
                    className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 border border-red-800 text-white"
                    title="Seti Sil"
                  >
                    Sil
                  </button>
                </div>
              </div>
              {/* Galeri yönetimi */}
              <div className="mt-4">
                <form className="flex flex-col gap-2" onSubmit={e => e.preventDefault()}>
                  <label className="font-medium text-sm text-gray-100">Fotoğraf(lar) Ekle</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleGalleryUpload(e, set.id)}
                    disabled={galleryUploading === set.id}
                    className="text-gray-100 bg-[#23232a] file:bg-[var(--accent)] file:text-[var(--foreground)]"
                  />
                  <span className="text-xs text-gray-100">Fotoğrafları ve metin balonlarını sürükleyerek sıralayabilirsiniz. Metin balonları fotoğrafların arasına yerleştirilebilir.</span>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, set.id)}
                  >
                    <SortableContext
                      items={(combinedItems[set.id] || []).map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {(combinedItems[set.id] || []).map((item) => (
                          <div key={item.id} className="group">
                            <SortableItem id={item.id} className="relative">
                              {item.type === 'photo' ? (
                                <div className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-700 hover:border-[var(--accent)] transition-all duration-300 overflow-hidden">
                                                        <img
                        src={(item.data as Photo).image_url}
                        alt={(item.data as Photo).alt_text || set.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                        <div className="p-3 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2" title={(item.data as Photo).alt_text}>
                            {(item.data as Photo).alt_text || 'Fotoğraf'}
                          </div>
                        </div>
                      </div>
                                </div>
                              ) : (
                                <div className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-700 hover:border-[var(--accent)] transition-all duration-300 flex flex-col items-center justify-center p-4">
                                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3">
                                    <span className="text-[var(--foreground)] text-lg font-bold">💬</span>
                                  </div>
                                                        <div className="text-center">
                        <div className="text-sm text-gray-100 line-clamp-3 leading-relaxed" title={(item.data as TextBubble).content}>
                          {(item.data as TextBubble).content}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Metin Balonu • {
                            ((item.data as TextBubble).size || 'medium') === 'small' ? 'Küçük' :
                            ((item.data as TextBubble).size || 'medium') === 'medium' ? 'Orta' : 'Büyük'
                          }
                        </div>
                      </div>
                                </div>
                              )}
                            </SortableItem>
                            
                            {/* Silme butonu - sürükle alanının dışında */}
                            <div className="mt-2 flex justify-center">
                              <button
                                type="button"
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                onClick={() => {
                                  if (item.type === 'photo') {
                                    handleDeletePhoto(item.id, set.id, (item.data as Photo).image_url);
                                  } else {
                                    handleDeleteTextBubble(item.id, set.id);
                                  }
                                }}
                                title="Sil"
                              >
                                {item.type === 'photo' ? 'Fotoğrafı Sil' : 'Metni Sil'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {galleryUploading === set.id && <div className="text-xs text-gray-100 mt-1">Yükleniyor...</div>}
                </form>
                <button
                  className="text-xs text-blue-200 font-semibold underline mt-4 hover:text-blue-400"
                  onClick={() => fetchSetContent(set.id)}
                  type="button"
                >
                  İçeriği Yenile
                </button>

                {/* Metin Balonu Yönetimi */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                                  <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleAddTextBubble(set.id); }}>
                  <label className="font-medium text-sm text-gray-100">Metin Balonu Ekle</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTextBubble[set.id]?.content || ""}
                      onChange={(e) => setNewTextBubble(prev => ({ 
                        ...prev, 
                        [set.id]: { 
                          content: e.target.value, 
                          size: prev[set.id]?.size || 'medium' 
                        } 
                      }))}
                      placeholder="Metin balonu içeriği..."
                      className="flex-1 px-3 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white placeholder-gray-400"
                    />
                    <select
                      value={newTextBubble[set.id]?.size || 'medium'}
                      onChange={(e) => setNewTextBubble(prev => ({ 
                        ...prev, 
                        [set.id]: { 
                          content: prev[set.id]?.content || "", 
                          size: e.target.value as 'small' | 'medium' | 'large' 
                        } 
                      }))}
                      className="px-3 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white"
                    >
                      <option value="small">Küçük</option>
                      <option value="medium">Orta</option>
                      <option value="large">Büyük</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-[var(--accent)] text-[var(--foreground)] font-semibold hover:opacity-90 transition"
                    >
                      Ekle
                    </button>
                  </div>
                </form>
                  

                  
                  <button
                    className="text-xs text-blue-200 font-semibold underline mt-4 hover:text-blue-400"
                    onClick={() => fetchSetContent(set.id)}
                    type="button"
                  >
                    İçeriği Yenile
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 