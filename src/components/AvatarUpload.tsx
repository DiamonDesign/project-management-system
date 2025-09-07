import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UploadCloud, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface AvatarUploadProps {
  uid: string;
  initialAvatarPath: string | null; // Changed to path
  onUpload: (path: string) => void; // Changed to path
}

export const AvatarUpload = ({ uid, initialAvatarPath, onUpload }: AvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialAvatarPath) {
      getPublicUrl(initialAvatarPath);
    } else {
      setAvatarUrl(null);
    }
  }, [initialAvatarPath]);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      showError('Por favor, selecciona una imagen para subir.');
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${uid}.${fileExt}`; // Use UID as filename to ensure one avatar per user

    setUploading(true);

    try {
      // First, try to upload. If it's a duplicate, it means an avatar already exists.
      // In that case, we'll try to update it.
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Try not to upsert initially
        });

      if (uploadError) {
        // If the error indicates the file already exists (e.g., duplicate key violation),
        // then try to update it. Supabase storage doesn't always give a clear "file exists" error,
        // so we handle it by trying to update if the initial upload fails.
        const { error: updateError } = await supabase.storage
          .from('avatars')
          .update(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Force overwrite
          });
        if (updateError) throw updateError;
      }

      // Get the public URL and pass the storage path back
      onUpload(filePath); // Pass the storage path, not the public URL
      showSuccess('Avatar subido exitosamente.');

    } catch (error: any) {
      showError('Error al subir el avatar: ' + error.message);
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
      // Clear the file input value to allow re-uploading the same file if needed
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Avatar" />
        ) : (
          <AvatarFallback>
            <User className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="avatar">Cambiar Avatar</Label>
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="cursor-pointer"
        />
        {uploading && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
          </div>
        )}
      </div>
    </div>
  );
};