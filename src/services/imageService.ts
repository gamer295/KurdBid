import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const pickImage = async (isMultiple: boolean = false): Promise<string[]> => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (isMultiple) {
        const { photos } = await Camera.pickImages({
          quality: 50,
          limit: 4
        });
        
        const results: string[] = [];
        for (const photo of photos) {
          try {
            const b64 = await convertWebPathToBase64(photo.webPath || '', photo.path);
            if (b64) results.push(b64);
          } catch (err) {
            console.error('Failed to convert photo in multiple pick:', err);
          }
        }
        return results;
      } else {
        const image = await Camera.getPhoto({
          quality: 50,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });
        return [image.dataUrl || ''];
      }
    } catch (error) {
      console.error('Camera plugin error (possible cancellation):', error);
      return [];
    }
  } else {
    return [];
  }
};

export const convertWebPathToBase64 = async (webPath: string, nativePath?: string): Promise<string> => {
  if (webPath.startsWith('data:')) return webPath;

  // Try Filesystem first on native as it is more reliable
  if (Capacitor.isNativePlatform() && nativePath) {
    try {
      const result = await Filesystem.readFile({
        path: nativePath
      });
      // result.data could be a string (base64) or a Blob depending on environment
      const base64Data = typeof result.data === 'string' ? result.data : '';
      if (base64Data) {
        return `data:image/jpeg;base64,${base64Data}`;
      }
    } catch (e) {
      console.warn('Filesystem read failed, falling back to fetch', e);
    }
  }

  if (!webPath) return '';

  try {
    const response = await fetch(webPath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        console.error('FileReader error during conversion');
        reject(new Error('FileReader error'));
      };
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('convertWebPathToBase64 failed for:', webPath, error);
    return ''; 
  }
};
