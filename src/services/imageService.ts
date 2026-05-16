import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const pickImage = async (isMultiple: boolean = false): Promise<string[]> => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (isMultiple) {
        const { photos } = await Camera.pickImages({
          quality: 50,
          limit: 4
        });
        return photos.map(p => p.webPath || '');
      } else {
        const image = await Camera.getPhoto({
          quality: 50,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos
        });
        return [image.webPath || ''];
      }
    } catch (error) {
      console.error('Camera plugin error:', error);
      return [];
    }
  } else {
    // Return empty array and let the web implementation handle it
    // Or we could implement a hidden file input here, but it's better to let pages decide
    return [];
  }
};

export const convertWebPathToBase64 = async (webPath: string): Promise<string> => {
  const response = await fetch(webPath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};
