"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const mountedRef = useRef(true)

  const stopCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    } catch (e) {
      console.warn('Error stopping camera:', e)
    }
    setIsScanning(false)
    setIsInitialized(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (isScanning || isInitialized) {
      console.log('Camera already running')
      return
    }

    setError(null)
    console.log('Starting camera...')

    try {
      // Очищаем предыдущую камеру
      await stopCamera()

      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 200))

      if (!videoRef.current) {
        setError('Video element not found')
        return
      }

      // Получаем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Устанавливаем стили
        videoRef.current.style.display = 'block'
        videoRef.current.style.visibility = 'visible'
        videoRef.current.style.opacity = '1'
      }

      setIsScanning(true)
      setIsInitialized(true)
      console.log('Camera started successfully')

    } catch (error) {
      console.error('Error starting camera:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('NotAllowedError')) {
        setError('Доступ к камере заблокирован. Разрешите доступ в настройках.')
      } else if (errorMessage.includes('NotReadableError')) {
        setError('Камера занята другим приложением.')
      } else if (errorMessage.includes('NotFoundError')) {
        setError('Камера не найдена.')
      } else {
        setError(`Ошибка: ${errorMessage}`)
      }
      
      setIsScanning(false)
      setIsInitialized(false)
    }
  }, [isScanning, isInitialized, stopCamera])

  useEffect(() => {
    mountedRef.current = true
    
    // Автоматически запускаем камеру
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        startCamera()
      }
    }, 500)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const handleClose = useCallback(async () => {
    mountedRef.current = false
    await stopCamera()
    onClose()
  }, [stopCamera, onClose])

  // Простая функция для тестирования - можно убрать позже
  const handleTestScan = useCallback(() => {
    console.log('Test scan triggered')
    onScan('test-qr-code-12345')
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Сканирование QR кода</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-200 rounded-lg object-cover"
            playsInline
            autoPlay
            muted
            style={{ 
              display: isInitialized ? 'block' : 'none',
              visibility: isInitialized ? 'visible' : 'hidden',
              opacity: isInitialized ? '1' : '0'
            }}
          />
          
          {!isInitialized && !error && (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Запуск камеры...</p>
                <button
                  onClick={startCamera}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  📷 Запустить
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={startCamera}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔄 Попробовать снова
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {isScanning 
              ? 'Камера запущена. Для тестирования нажмите кнопку ниже.' 
              : 'Запуск камеры...'
            }
          </p>
          {isScanning && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-xs">Камера активна</span>
            </div>
          )}
        </div>

        {/* Временная кнопка для тестирования */}
        {isScanning && (
          <div className="mt-4 text-center">
            <button
              onClick={handleTestScan}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              🧪 Тест сканирования
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}