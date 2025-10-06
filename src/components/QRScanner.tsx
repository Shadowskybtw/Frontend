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
  const [userStarted, setUserStarted] = useState(false)
  const mountedRef = useRef(true)
  const isScanningRef = useRef(false)
  const isInitializedRef = useRef(false)

  const handleScan = useCallback((result: QrScanner.ScanResult) => {
    if (mountedRef.current && isScanningRef.current) {
      onScan(result.data)
    }
  }, [onScan])

  const stopScanner = useCallback(async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e)
    }
    setIsScanning(false)
    setIsInitialized(false)
    isScanningRef.current = false
    isInitializedRef.current = false
  }, [])

  const startScanner = useCallback(async () => {
    if (isScanning || isInitialized) {
      return
    }

    setUserStarted(true)
    setError(null)

    try {
      // Проверяем наличие камеры
      const hasCamera = await QrScanner.hasCamera()
      
      if (!hasCamera) {
        setError('Камера не найдена')
        return
      }

      // Очищаем предыдущий сканер
      await stopScanner()

      // Небольшая задержка для стабильности
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!videoRef.current) {
        setError('Video element not found')
        return
      }

      // Создаем QrScanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleScan,
        {
          maxScansPerSecond: 2,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      )

      // Запускаем сканер
      await qrScannerRef.current.start()
      
      // Устанавливаем стили после успешного запуска
      if (videoRef.current) {
        const video = videoRef.current as HTMLVideoElement
        video.style.display = 'block'
        video.style.visibility = 'visible'
        video.style.opacity = '1'
        video.style.width = '100%'
        video.style.height = '256px'
        video.style.objectFit = 'cover'
        video.style.backgroundColor = 'transparent'
        video.style.borderRadius = '8px'
      }

      setIsScanning(true)
      setIsInitialized(true)
      isScanningRef.current = true
      isInitializedRef.current = true

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
      isScanningRef.current = false
      isInitializedRef.current = false
    }
  }, [stopScanner, handleScan, isScanning, isInitialized])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [stopScanner])

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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm mb-4">Нажмите кнопку для запуска камеры</p>
                <button
                  onClick={startScanner}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  📷 Запустить камеру
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
              ? 'Наведите камеру на QR код для сканирования' 
              : userStarted 
                ? 'Запуск камеры...' 
                : 'Нажмите кнопку выше для запуска камеры'
            }
          </p>
          {isScanning && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-xs">Сканирование QR кодов...</span>
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