export const CLASSIC_AVATARS = [
  {
    id: "neymar",
    name: "Neymar Jr (2014)",
    url: "https://i.pinimg.com/736x/60/3a/93/603a9343ed309ff15ee4f67f87d6fb43.jpg"
  },
  {
    id: "ronaldo",
    name: "Ronaldo Fenômeno",
    url: "https://i.pinimg.com/736x/48/96/e5/4896e592ec3de3be90b6b0714a9d1795.jpg"
  },
  {
    id: "ronaldinho",
    name: "Ronaldinho Gaúcho",
    url: "https://i.pinimg.com/736x/15/9a/93/159a9387c36e8f2ad34bf860310490f5.jpg"
  }
];

/**
 * Compresses an image file using the Canvas API and crops it to a 1:1 square.
 * Returns a Base64 string of the compressed image.
 */
export async function compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        // Calculate square crop (centered)
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        canvas.width = maxWidth;
        canvas.height = maxWidth;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, maxWidth, maxWidth);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
