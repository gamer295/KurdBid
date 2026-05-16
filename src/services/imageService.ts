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
        if (image.dataUrl) {
          const resized = await resizeImage(image.dataUrl);
          return [resized];
        }
        return [];
      }
    } catch (error) {
      console.error('Camera plugin error (possible cancellation):', error);
      return [];
    }
  } else {
    return [];
  }
};

export const resizeImage = (base64Str: string, maxWidth = 400, maxHeight = 400, quality = 0.4): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str) return resolve('');
    
    // Safety check: if the input is already small enough, we might still want to resize to be sure
    // But if resize fails, we definitely don't want to return a string > 1MB
    
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        let result = canvas.toDataURL('image/jpeg', quality);
        
        // Final sanity check: Firestore limit is 1MB. Base64 is ~1.37x binary.
        // 1MB = 1,048,576 bytes.
        // We want to stay well under that. Let's say 800,000 characters.
        if (result.length > 800000) {
          // If still too big, try smaller dimensions and lower quality
          const smallerCanvas = document.createElement('canvas');
          smallerCanvas.width = width * 0.7;
          smallerCanvas.height = height * 0.7;
          const sctx = smallerCanvas.getContext('2d');
          if (sctx) {
            sctx.fillStyle = '#FFFFFF';
            sctx.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height);
            sctx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
            result = smallerCanvas.toDataURL('image/jpeg', 0.2);
          }
        }
        
        resolve(result);
      } catch (e) {
        console.error('Resize internal error:', e);
        // If everything fails, return a very small placeholder or empty to avoid 1MB error
        resolve(''); 
      }
    };
    img.onerror = () => {
      console.error('Image load error during resize');
      // If it's not a valid image, do not return the potentially huge original string
      resolve(base64Str.length < 800000 ? base64Str : ''); 
    };
  });
};

export const convertWebPathToBase64 = async (webPath: string, nativePath?: string): Promise<string> => {
  if (webPath.startsWith('data:')) {
    return await resizeImage(webPath);
  }

  let base64 = '';
  // Try Filesystem first on native as it is more reliable
  if (Capacitor.isNativePlatform() && nativePath) {
    try {
      const result = await Filesystem.readFile({
        path: nativePath
      });
      // result.data could be a string (base64) or a Blob depending on environment
      const base64Data = typeof result.data === 'string' ? result.data : '';
      if (base64Data) {
        base64 = `data:image/jpeg;base64,${base64Data}`;
      }
    } catch (e) {
      console.warn('Filesystem read failed, falling back to fetch', e);
    }
  }

  if (!base64 && webPath) {
    try {
      const response = await fetch(webPath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('convertWebPathToBase64 fetch failed for:', webPath, error);
    }
  }

  if (base64) {
    return await resizeImage(base64);
  }
  return '';
};
