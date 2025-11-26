import type Konva from 'konva';

/**
 * Export body diagram canvas as PNG data URL
 */
export const exportToPNG = (stage: Konva.Stage): string => {
  return stage.toDataURL({
    pixelRatio: 2, // Higher quality
    mimeType: 'image/png',
  });
};

/**
 * Export body diagram canvas as PNG Blob
 */
export const exportToPNGBlob = async (stage: Konva.Stage): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    stage.toBlob({
      callback: (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export canvas to blob'));
        }
      },
      pixelRatio: 2,
      mimeType: 'image/png',
    });
  });
};

/**
 * Download body diagram as PNG file
 */
export const downloadPNG = (stage: Konva.Stage, filename = 'body-diagram.png') => {
  const dataURL = exportToPNG(stage);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert data URL to Blob
 */
export const dataURLtoBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Upload body diagram PNG to Supabase Storage
 */
export const uploadBodyDiagramImage = async (
  blob: Blob,
  treatmentRecordId: string,
  supabaseClient: { storage: { from: (bucket: string) => { upload: (path: string, file: Blob, options: { contentType: string }) => Promise<{ data: unknown; error: unknown }> } } }
): Promise<string> => {
  const filename = `body-diagrams/${treatmentRecordId}-${Date.now()}.png`;

  const { data: _data, error } = await supabaseClient.storage
    .from('treatment-records')
    .upload(filename, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from('treatment-records')
    .getPublicUrl(filename);

  return urlData.publicUrl;
};
