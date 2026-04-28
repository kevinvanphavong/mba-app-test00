/**
 * Compresse une image (File) côté client avant upload :
 *   - resize au max maxDimension (côté le plus long)
 *   - encodage JPEG qualité quality (0-1)
 *
 * Réduit typiquement une photo téléphone 3-5 MB à 100-300 KB,
 * ce qui économise la bande passante mobile et le stockage serveur.
 *
 * Note technique : on passe par un canvas, ce qui supprime aussi les
 * métadonnées EXIF (notamment GPS). C'est volontaire pour la vie privée.
 */
export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality      = 0.85,
): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader  = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Lecture du fichier échouée'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload  = () => resolve(i)
    i.onerror = () => reject(new Error('Décodage de l\'image échoué'))
    i.src     = dataUrl
  })

  // Calcule les nouvelles dimensions (préserve l'aspect ratio)
  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const w     = Math.round(img.width  * ratio)
  const h     = Math.round(img.height * ratio)

  const canvas  = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d non disponible')

  ctx.drawImage(img, 0, 0, w, h)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression échouée'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}
