"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react'
import QrScanner from 'qr-scanner'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const mountedRef = useRef(true)

  const handleScan = useCallback((result: QrScanner.ScanResult) => {
    console.log('QR Code detected:', result.data)
    if (mountedRef.current && isScanning) {
      console.log('QR Code scanned successfully:', result.data)
      onScan(result.data)
    }
  }, [onScan, isScanning])

  const stopScanner = useCallback(async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e)
    }
    setIsScanning(false)
    setIsInitialized(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (isScanning || isInitialized) {
      console.log('Scanner already running')
      return
    }

    setError(null)
    console.log('Starting QR scanner...')

    try {
      // Проверяем наличие камеры
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setError('Камера не найдена')
        return
      }

      // Очищаем предыдущий сканер
      await stopScanner()

      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!videoRef.current) {
        setError('Video element not found')
        return
      }

      // Создаем новый сканер
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleScan,
        {
          maxScansPerSecond: 1,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: 'environment'
        }
      )

      // Запускаем сканер
      await qrScannerRef.current.start()
      
      // Устанавливаем стили
      if (videoRef.current) {
        videoRef.current.style.display = 'block'
        videoRef.current.style.visibility = 'visible'
        videoRef.current.style.opacity = '1'
      }

      setIsScanning(true)
      setIsInitialized(true)
      console.log('Scanner started successfully')

    } catch (error) {
      console.error('Error starting scanner:', error)
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
  }, [isScanning, isInitialized, stopScanner, handleScan])

  useEffect(() => {
    mountedRef.current = true
    
    // Автоматически запускаем сканер
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        startScanner()
      }
    }, 500)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      stopScanner()
    }
  }, [startScanner, stopScanner])

  const handleClose = useCallback(async () => {
    mountedRef.current = false
    await stopScanner()
    onClose()
  }, [stopScanner, onClose])

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
                  onClick={startScanner}
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
              onClick={startScanner}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔄 Попробовать снова
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {isScanning 
              ? 'Наведите камеру на QR код' 
              : 'Запуск камеры...'
            }
          </p>
          {isScanning && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-xs">Сканирование...</span>
            </div>
          )}
        </div>

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