import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { uploadEventImage } from '../../hooks/useEventMutations'
import { fitBox, SUPPORTER_TILE } from '../../lib/logoNormalise'

/** Canvas draws at 2x so the tile is crisp on retina. */
const SCALE = 2

/**
 * Flatten a logo onto a solid plate at a fixed size.
 *
 * Baking the plate into the pixels rather than applying it in CSS is deliberate:
 * it survives dark-mode inversion in Apple Mail and Outlook.com, which a
 * transparent PNG does not.
 */
async function normaliseToPlate(file, plate, tile) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = tile.width * SCALE
  canvas.height = tile.height * SCALE

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = plate
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const box = fitBox({
    srcW: bitmap.width,
    srcH: bitmap.height,
    tileW: tile.width,
    tileH: tile.height,
  })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    bitmap,
    box.x * SCALE,
    box.y * SCALE,
    box.width * SCALE,
    box.height * SCALE,
  )
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render the logo')
  return new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' })
}

export default function ImageUpload({
  value,
  onChange,
  normalise = false,
  plate = '#ffffff',
  tile = SUPPORTER_TILE,
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)
    try {
      // SVGs have no intrinsic bitmap size for createImageBitmap to work from,
      // so they upload as-is rather than being silently mangled.
      const shouldNormalise = normalise && file.type !== 'image/svg+xml'
      const toUpload = shouldNormalise
        ? await normaliseToPlate(file, plate, tile)
        : file
      const url = await uploadEventImage(toUpload)
      onChange(url)
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-32 rounded-lg"
            style={{ objectFit: normalise ? 'contain' : 'cover', background: normalise ? plate : undefined }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
          <Upload size={24} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Click to upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
      {/* Fallback: paste a URL */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste an image URL"
        className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
