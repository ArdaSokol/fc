# Music Feature Setup

## Database Schema Update

First, add the `music_url` column to the `photosets` table:

```sql
-- Add music_url column to photosets table
ALTER TABLE photosets ADD COLUMN music_url TEXT;
```

## Supabase Storage Setup

### 1. Create Music Storage Bucket

In your Supabase Dashboard, go to Storage and create a new bucket called `music`:

1. Go to **Storage** in your Supabase Dashboard
2. Click **"New bucket"**
3. Name: `music`
4. Public bucket: ✅ **Yes** (so music files can be accessed publicly)
5. Click **"Create bucket"**

### 2. Set Storage Policies

Run these SQL commands in the SQL Editor to allow music file uploads and downloads:

```sql
-- Allow authenticated users to upload music files
CREATE POLICY "Users can upload music files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'music' AND 
  auth.role() = 'authenticated'
);

-- Allow public access to music files
CREATE POLICY "Public can view music files" ON storage.objects
FOR SELECT USING (bucket_id = 'music');

-- Allow authenticated users to delete their music files
CREATE POLICY "Users can delete music files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'music' AND 
  auth.role() = 'authenticated'
);
```

## Features Added

1. **Music Upload**: Admins can upload MP3 files when creating photo sets
2. **Auto-Play**: Music automatically starts when viewing a photo set with music
3. **Global Player**: Fixed music player in bottom-right corner with:
   - Play/Pause controls
   - Volume control
   - Track information
   - Mobile-responsive design
4. **Music Management**: Music stops when navigating away from photo sets
5. **Persistent Volume**: Volume settings are saved in localStorage

## Usage

1. **Upload Music**: When creating a photo set, use the "Müzik Dosyası" field to upload an MP3 file
2. **Auto-Play**: When visitors view a photo set with music, it will automatically start playing
3. **Controls**: Use the music player in the bottom-right corner to control playback
4. **Mobile**: On mobile devices, the player collapses to a small icon that can be expanded

## File Structure

- `src/components/MusicPlayer.tsx` - Main music player component
- `src/components/GlobalMusicPlayer.tsx` - Global player wrapper
- `src/contexts/MusicContext.tsx` - Music state management
- Updated admin page with music upload
- Updated photo set detail page with auto-play
- Updated home page to stop music when visiting 