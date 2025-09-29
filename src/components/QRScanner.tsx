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
  const [userStarted, setUserStarted] = useState(false) // Новый флаг для user gesture
  const mountedRef = useRef(true)

  const handleScan = useCallback((result: QrScanner.ScanResult) => {
    console.log('QR Code detected:', result.data)
    console.log('Scanner state - mounted:', mountedRef.current, 'isScanning:', isScanning)
    
    if (mountedRef.current && isScanning) {
      console.log('QR Code scanned successfully:', result.data)
      onScan(result.data)
    } else {
      console.log('QR Code detected but scanner not ready')
    }
  }, [onScan, isScanning])

  // Helper: простой безопасный стоп сканера
  const safeStop = useCallback(async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    } catch (e) {
      console.warn('safeStop failed', e)
    }
    setIsScanning(false)
    setIsInitialized(false)
  }, [])



  // Start/stop button for mobile - user gesture
  const handleUserStart = async () => {
    if (isScanning || isInitialized) {
      console.log('Scanner already running, ignoring start request')
      return
    }
    
    console.log('User started scanner')
    setUserStarted(true)
    setError(null)
    
    try {
      // Проверяем камеру
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setError('Камера не найдена. Введите код вручную.')
        return
      }

      // Очищаем предыдущий сканер
      await safeStop()

      // Небольшая задержка для стабильности
      await new Promise(resolve => setTimeout(resolve, 100))

      // Создаем QrScanner стандартным способом
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          handleScan,
          {
            maxScansPerSecond: 5,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        )

        console.log('Starting QrScanner...')
        try {
          await qrScannerRef.current.start()
          console.log('QrScanner.start() completed')
        } catch (startError) {
          console.error('QrScanner start error:', startError)
          setError('Ошибка запуска сканера QR кодов')
          throw startError
        }
        
        // Устанавливаем стили после запуска
        if (videoRef.current) {
          const video = videoRef.current as HTMLVideoElement
          video.style.display = 'block'
          video.style.visibility = 'visible'
          video.style.opacity = '1'
          video.style.width = '100%'
          video.style.height = '256px'
          video.style.objectFit = 'cover'
          video.style.backgroundColor = 'transparent'
        }
      }
      
      // Устанавливаем состояние
      setIsScanning(true)
      setIsInitialized(true)
      setError(null)
      console.log('Scanner started successfully')
      
    } catch (error) {
      console.error('Error starting camera:', error)
      const em = error instanceof Error ? error.message : String(error)
      
      if (em.includes('NotAllowedError') || em.includes('permission')) {
        setError('Доступ к камере заблокирован. Разрешите доступ к камере в настройках браузера или Telegram.')
      } else if (em.includes('NotReadableError')) {
        setError('Камера занята другим приложением. Закройте другие приложения, использующие камеру.')
      } else if (em.includes('NotFoundError')) {
        setError('Камера не найдена. Убедитесь, что у вас есть камера.')
      } else {
        setError('Не удалось запустить камеру. Попробуйте ввести QR код вручную.')
      }
      
      setIsScanning(false)
      setIsInitialized(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    
    // Автоматически запускаем камеру при открытии модального окна
    const autoStart = async () => {
      // Небольшая задержка для стабильности
      await new Promise(resolve => setTimeout(resolve, 500))
      if (mountedRef.current && !isScanning && !isInitialized) {
        console.log('Auto-starting camera...')
        try {
          await handleUserStart()
        } catch (error) {
          console.error('Auto-start failed:', error)
          setError('Не удалось автоматически запустить камеру. Попробуйте вручную.')
        }
      }
    }
    
    autoStart()

    return () => {
      mountedRef.current = false
      safeStop()
    }
  }, [safeStop, handleUserStart, isScanning, isInitialized])

  const handleClose = async () => {
    mountedRef.current = false
    await safeStop()
    onClose()
  }

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
                  opacity: isInitialized ? '1' : '0',
                  width: '100%',
                  height: '256px',
                  objectFit: 'cover'
                }}
              />
              {!isInitialized && !error && (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Запуск камеры...</p>
                    <p className="text-gray-500 text-xs mt-1">Разрешите доступ к камере</p>
                  </div>
                </div>
              )}
            </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={handleUserStart}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              📷 Попробовать снова
            </button>
          </div>
        )}

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                {isScanning 
                  ? 'Наведите камеру на QR код для сканирования' 
                  : 'Запуск камеры...'
                }
              </p>
              {isScanning && (
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-xs">Сканирование QR кодов...</span>
                </div>
              )}
              
              {isScanning && (
                <div className="mt-2 text-center">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full animate-pulse">
                    Наведите камеру на QR код
                  </div>
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
