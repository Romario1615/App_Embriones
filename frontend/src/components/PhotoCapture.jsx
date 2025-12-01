/**
 * Componente para capturar fotos con cámara o subir desde archivo
 * Permite hasta 6 fotos con opciones de eliminar
 */
import { useState, useRef } from 'react'
import { Camera, Upload, X, ZoomIn, Trash2 } from 'lucide-react'

export default function PhotoCapture({ photos = [], onChange, maxPhotos = 6 }) {
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Iniciar cámara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      })
      setStream(mediaStream)
      setShowCamera(true)

      // Esperar un poco para que el video esté listo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      alert('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }

  // Detener cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Configurar tamaño del canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar frame actual del video
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        addPhoto(file)
      }
    }, 'image/jpeg', 0.9)

    stopCamera()
  }

  // Agregar foto
  const addPhoto = (file) => {
    if (photos.length >= maxPhotos) {
      alert(`Máximo ${maxPhotos} fotos permitidas`)
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5242880) {
      alert('La imagen no debe superar 5MB')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const newPhoto = {
        id: Date.now(),
        file,
        preview: reader.result,
        name: file.name
      }
      onChange([...photos, newPhoto])
    }
    reader.readAsDataURL(file)
  }

  // Eliminar foto
  const removePhoto = (photoId) => {
    onChange(photos.filter(p => p.id !== photoId))
  }

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    files.forEach(file => addPhoto(file))
    event.target.value = '' // Reset input
  }

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      {!showCamera && photos.length < maxPhotos && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="btn-primary flex items-center space-x-2"
          >
            <Camera size={18} />
            <span>Tomar Foto</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload size={18} />
            <span>Subir Archivo</span>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="btn-secondary flex items-center space-x-2"
          >
            <Camera size={18} />
            <span>Tomar con cámara</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Botón que abre directamente la cámara del dispositivo (mobile friendly) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Contador de fotos */}
      <div className="text-sm text-gray-600">
        {photos.length} de {maxPhotos} fotos
      </div>

      {/* Modal de cámara */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Video preview */}
          <div className="flex-1 flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controles */}
          <div className="bg-gray-900 p-6 flex justify-center items-center space-x-4">
            <button
              type="button"
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              className="px-8 py-4 bg-primary text-white rounded-full hover:bg-primary-dark flex items-center space-x-2 text-lg font-semibold"
            >
              <Camera size={24} />
              <span>Capturar</span>
            </button>
          </div>
        </div>
      )}

      {/* Galería de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.preview}
                alt={photo.name}
                className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="Ver imagen completa"
                >
                  <ZoomIn size={20} className="text-gray-800" />
                </button>

                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-2 bg-red-500/90 rounded-full hover:bg-red-600 transition-colors"
                  title="Eliminar foto"
                >
                  <Trash2 size={20} className="text-white" />
                </button>
              </div>

              {/* Indicador de número */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                {photos.indexOf(photo) + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de vista previa */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              title="Cerrar"
            >
              <X size={32} />
            </button>

            <img
              src={selectedPhoto.preview}
              alt={selectedPhoto.name}
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
              <p className="text-sm">{selectedPhoto.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removePhoto(selectedPhoto.id)
                  setSelectedPhoto(null)
                }}
                className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Eliminar esta foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
