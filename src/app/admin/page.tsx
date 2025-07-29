"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import ThemeToggle from '@/components/ThemeToggle';
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PhotoSet {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  music_url?: string;
  order?: number;
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

interface HomePageSettings {
  id: string;
  homepage_music_url?: string;
  homepage_music_title?: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [combinedItems, setCombinedItems] = useState<{[key: string]: Array<{id: string, type: 'photo' | 'textBubble', data: Photo | TextBubble}>}>({});
  const [form, setForm] = useState({ title: "", description: "", cover_image_url: "", music_url: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [musicUploading, setMusicUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryUploading, setGalleryUploading] = useState<string | null>(null);
  const [newTextBubble, setNewTextBubble] = useState<{[key: string]: {content: string, size: 'small' | 'medium' | 'large'}}>({});
  const [error, setError] = useState<string | null>(null);
  const [homePageSettings, setHomePageSettings] = useState<HomePageSettings | null>(null);
  const [homePageMusicUploading, setHomePageMusicUploading] = useState(false);
  const homePageMusicFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    setUser(user);
  };

  useEffect(() => {
    getUser();
    fetchPhotoSets();
    fetchHomePageSettings();
  }, []);

  const fetchPhotoSets = async () => {
    const { data, error } = await supabase
      .from("photosets")
      .select("*")
      .order("order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPhotoSets(data as PhotoSet[]);
      // Fetch photos and text bubbles for each set
      for (const set of data) {
        fetchPhotos(set.id);
        fetchTextBubbles(set.id);
      }
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
          // Table doesn't exist - create it
          console.log('Creating homepage_settings table...');
          try {
            const { data: newSettings, error: createError } = await supabase
              .from('homepage_settings')
              .insert([{ id: '1', homepage_music_url: '', homepage_music_title: '' }])
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating homepage settings:', createError);
              setError('Ana sayfa ayarları oluşturulurken hata oluştu. Lütfen database tablosunu manuel olarak oluşturun.');
              return;
            }
            setHomePageSettings(newSettings);
          } catch (createError) {
            console.error('Error creating homepage settings:', createError);
            setError('Ana sayfa ayarları oluşturulurken hata oluştu. Lütfen database tablosunu manuel olarak oluşturun.');
          }
          return;
        }
        throw error;
      }
      
      if (data) {
        setHomePageSettings(data);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      setError('Ana sayfa ayarları yüklenirken hata oluştu. Lütfen database tablosunu manuel olarak oluşturun.');
    }
  };

  const fetchSetContent = async (setId: string) => {
    try {
      await fetchPhotos(setId);
      await fetchTextBubbles(setId);
      // Son olarak combined items'ı güncelle
      updateCombinedItems(setId);
    } catch (error) {
      console.error('Fetch set content error:', error);
      setError('İçerik yenileme hatası: ' + error);
    }
  };

  const updateCombinedItems = (setId: string) => {
    setCombinedItems(prev => {
      const currentItems = prev[setId] || [];
      const photos = currentItems.filter(item => item.type === 'photo');
      const textBubbles = currentItems.filter(item => item.type === 'textBubble');
      
      const allItems = [...photos, ...textBubbles].sort((a, b) => {
        const aOrder = a.type === 'photo' ? (a.data as Photo).order : (a.data as TextBubble).order;
        const bOrder = b.type === 'photo' ? (b.data as Photo).order : (b.data as TextBubble).order;
        return aOrder - bOrder;
      });
      
      return { ...prev, [setId]: allItems };
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setForm({ ...form, cover_image_url: publicUrl });
      setCoverPreview(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Yükleme hatası: ' + error);
    } finally {
      setUploading(false);
    }
  };

  const handleMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMusicUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      setForm({ ...form, music_url: publicUrl });
    } catch (error) {
      console.error('Music upload error:', error);
      setError('Müzik yükleme hatası: ' + error);
    } finally {
      setMusicUploading(false);
    }
  };

  const handleHomePageMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHomePageMusicUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      // Update homepage settings
      const { error: updateError } = await supabase
        .from('homepage_settings')
        .update({ 
          homepage_music_url: publicUrl, 
          homepage_music_title: file.name.replace(/\.[^/.]+$/, ""),
          updated_at: new Date().toISOString()
        })
        .eq('id', '1');

      if (updateError) throw updateError;

      // Refresh homepage settings
      await fetchHomePageSettings();
    } catch (error) {
      console.error('Homepage music upload error:', error);
      setError('Ana sayfa müziği güncelleme hatası: ' + error);
    } finally {
      setHomePageMusicUploading(false);
    }
  };

  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from("photosets")
        .insert([form]);
      if (error) throw error;
      setForm({ title: "", description: "", cover_image_url: "", music_url: "" });
      setCoverPreview(null);
      fetchPhotoSets();
    } catch (error) {
      console.error('Add set error:', error);
      setError('Set ekleme hatası: ' + error);
    } finally {
      setFormLoading(false);
    }
  };

  const fetchPhotos = async (setId: string) => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("set_id", setId)
      .order("order");
    if (!error && data) {
      const photos = data.map(photo => ({ id: photo.id, type: 'photo' as const, data: photo }));
      setCombinedItems(prev => ({ ...prev, [setId]: [...(prev[setId] || []).filter(item => item.type !== 'photo'), ...photos] }));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, setId: string) => {
    const files = e.target.files;
    if (!files) return;

    setGalleryUploading(setId);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("photos")
          .insert([{
            set_id: setId,
            image_url: publicUrl,
            alt_text: file.name,
            order: i
          }]);

        if (insertError) throw insertError;
      }
      fetchPhotos(setId);
    } catch (error) {
      console.error('Gallery upload error:', error);
      setError('Fotoğraf yükleme hatası: ' + error);
    } finally {
      setGalleryUploading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string, setId: string, imageUrl: string) => {
    try {
      // Delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('photos').remove([fileName]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);
      
      if (error) throw error;
      fetchPhotos(setId);
    } catch (error) {
      console.error('Delete photo error:', error);
      setError('Fotoğraf silme hatası: ' + error);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      const { error } = await supabase
        .from("photosets")
        .delete()
        .eq("id", setId);
      if (error) throw error;
      fetchPhotoSets();
    } catch (error) {
      console.error('Delete set error:', error);
      setError('Set silme hatası: ' + error);
    }
  };

  const handleUpdateCover = async (setId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("photosets")
        .update({ cover_image_url: publicUrl })
        .eq("id", setId);

      if (updateError) throw updateError;
      fetchPhotoSets();
    } catch (error) {
      console.error('Update cover error:', error);
      setError('Kapak güncelleme hatası: ' + error);
    }
  };

  const handleUpdateMusic = async (setId: string, file: File) => {
    setMusicUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("photosets")
        .update({ music_url: publicUrl })
        .eq("id", setId);

      if (updateError) throw updateError;
      fetchPhotoSets();
    } catch (error) {
      console.error('Update music error:', error);
      setError('Müzik güncelleme hatası: ' + error);
    } finally {
      setMusicUploading(false);
    }
  };

  const fetchTextBubbles = async (setId: string) => {
    const { data, error } = await supabase
      .from("text_bubbles")
      .select("*")
      .eq("set_id", setId)
      .order("order");
    if (!error && data) {
      const textBubbles = data.map(bubble => ({ id: bubble.id, type: 'textBubble' as const, data: bubble }));
      setCombinedItems(prev => ({ ...prev, [setId]: [...(prev[setId] || []).filter(item => item.type !== 'textBubble'), ...textBubbles] }));
    }
  };

  const handleAddTextBubble = async (setId: string) => {
    const content = newTextBubble[setId]?.content;
    const size = newTextBubble[setId]?.size || 'medium';
    
    if (!content?.trim()) return;

    try {
      const { error } = await supabase
        .from("text_bubbles")
        .insert([{
          set_id: setId,
          content: content.trim(),
          size: size,
          order: (combinedItems[setId] || []).length
        }]);

      if (error) throw error;
      
      setNewTextBubble(prev => ({ ...prev, [setId]: { content: "", size: 'medium' } }));
      fetchTextBubbles(setId);
    } catch (error) {
      console.error('Add text bubble error:', error);
      setError('Metin balonu ekleme hatası: ' + error);
    }
  };

  const handleDeleteTextBubble = async (bubbleId: string, setId: string) => {
    try {
      const { error } = await supabase
        .from("text_bubbles")
        .delete()
        .eq("id", bubbleId);
      
      if (error) throw error;
      fetchTextBubbles(setId);
    } catch (error) {
      console.error('Delete text bubble error:', error);
      setError('Metin balonu silme hatası: ' + error);
    }
  };

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

  const handlePhotoSetDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photoSets.findIndex(set => set.id === active.id);
    const newIndex = photoSets.findIndex(set => set.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newPhotoSets = arrayMove(photoSets, oldIndex, newIndex);
    setPhotoSets(newPhotoSets);

    // Update order in database for all photo sets
    for (let i = 0; i < newPhotoSets.length; i++) {
      const set = newPhotoSets[i];
      await supabase.from("photosets").update({ order: i }).eq("id", set.id);
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
        <div>
          <label className="block mb-1 font-medium text-gray-100">Müzik Dosyası (Opsiyonel)</label>
          <input
            type="file"
            accept="audio/*"
            ref={musicFileInputRef}
            onChange={handleMusicFileChange}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-[var(--foreground)] hover:file:opacity-90 bg-[#1a1a1a] border border-gray-700 rounded"
            disabled={musicUploading}
          />
          {musicUploading && <div className="text-xs text-gray-300 mt-1">Müzik yükleniyor...</div>}
          {form.music_url && (
            <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded text-green-300 text-xs">
              ✓ Müzik dosyası yüklendi
            </div>
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

      {/* Ana Sayfa Müziği Ayarları */}
      <div className="w-full max-w-md bg-[#23232a] rounded-xl shadow p-6 flex flex-col gap-4 border border-gray-800">
        <h2 className="text-xl font-semibold mb-2 text-white">Ana Sayfa Müziği Ayarları</h2>
        <div>
          <label className="block mb-1 font-medium text-gray-100">Ana Sayfa Müziği (Opsiyonel)</label>
          <input
            type="file"
            accept="audio/*"
            ref={homePageMusicFileInputRef}
            onChange={handleHomePageMusicFileChange}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-[var(--foreground)] hover:file:opacity-90 bg-[#1a1a1a] border border-gray-700 rounded"
            disabled={homePageMusicUploading}
          />
          {homePageMusicUploading && <div className="text-xs text-gray-300 mt-1">Ana sayfa müziği yükleniyor...</div>}
          {homePageSettings?.homepage_music_url && (
            <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded text-green-300 text-xs">
              ✓ Ana sayfa müziği yüklendi: {homePageSettings.homepage_music_title}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            Ana sayfada otomatik olarak çalacak müzik dosyası. Ziyaretçiler ana sayfaya girdiğinde bu müzik otomatik olarak başlayacak.
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Fotoğraf Setleri</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePhotoSetDragEnd}
            >
              <SortableContext
                items={photoSets.map(set => set.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-6">
                  {photoSets.map(set => (
                    <div key={set.id} className="bg-[#23232a] rounded-2xl border border-gray-800">
                      <SortableItem id={set.id}>
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            {/* Kapak Fotoğrafı Kutucuğu - Kare */}
                            <div className="relative w-20 h-20 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                              {set.cover_image_url ? (
                                <img 
                                  src={set.cover_image_url} 
                                  alt={set.title} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <div className="text-center">
                                    <div className="text-2xl mb-1">📷</div>
                                    <div className="text-xs">Kapak Yok</div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Kapak Güncelleme Butonu */}
                              <div className="absolute top-1 right-1">
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
                                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-1 py-0.5 rounded text-xs cursor-pointer transition-all"
                                  title="Kapak Görselini Güncelle"
                                >
                                  📷
                                </label>
                              </div>
                            </div>
                            
                                                          <div className="flex-1">
                                <div className="font-bold text-lg text-white">{set.title}</div>
                                <div className="text-xs text-gray-300 mt-1">{new Date(set.created_at).toLocaleString()}</div>
                              {set.music_url && (
                                <div className="text-xs text-green-400 mt-1">🎵 Müzik dosyası mevcut</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUpdateMusic(set.id, file);
                                }}
                                className="hidden"
                                id={`music-${set.id}`}
                                disabled={musicUploading}
                              />
                              <label
                                htmlFor={`music-${set.id}`}
                                className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 border border-green-800 text-white cursor-pointer"
                                title="Müzik Dosyası Ekle/Güncelle"
                              >
                                {musicUploading ? "Yükleniyor..." : "🎵 Müzik"}
                              </label>
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 border border-red-800 text-white"
                                title="Seti Sil"
                              >
                                🗑️ Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                  
                  {/* Galeri yönetimi */}
                  <div className="px-4 pb-4">
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
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(combinedItems[set.id] || []).map((item) => (
                              <div key={item.id} className="relative">
                                <SortableItem id={item.id}>
                                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 w-40 h-40 flex items-center justify-center">
                                    {item.type === 'photo' ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <img 
                                          src={(item.data as Photo).image_url} 
                                          alt={(item.data as Photo).alt_text}
                                          className="w-28 h-28 object-cover rounded"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="w-28 h-28 bg-[var(--accent)] rounded flex items-center justify-center">
                                          <span className="text-white text-xl">T</span>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-sm text-gray-100">Metin Balonu</div>
                                          <div className="text-xs text-gray-500">
                                            Boyut: {
                                              ((item.data as TextBubble).size || 'medium') === 'small' ? 'Küçük' : 
                                              ((item.data as TextBubble).size || 'medium') === 'medium' ? 'Orta' : 'Büyük'
                                            }
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
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
                  </div>
                  
                  {/* Metin Balonu Yönetimi */}
                  <div className="px-4 pb-4">
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
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// SortableItem component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
} 