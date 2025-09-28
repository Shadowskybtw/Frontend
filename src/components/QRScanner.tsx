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
    if (mountedRef.current && isScanning) {
      console.log('QR Code scanned:', result.data)
      onScan(result.data)
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
      // Получаем видео поток и сразу используем его
      console.log('Getting video stream...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        const video = videoRef.current as HTMLVideoElement
        video.srcObject = stream
        await video.play()
        
        // Устанавливаем стили
        video.style.display = 'block'
        video.style.visibility = 'visible'
        video.style.opacity = '1'
        video.style.width = '100%'
        video.style.height = '256px'
        video.style.objectFit = 'cover'
        video.style.backgroundColor = 'transparent'
        
        console.log('Video stream set and playing')
      }
      
      // Создаем QrScanner поверх уже работающего видео
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          handleScan,
          {
            maxScansPerSecond: 1,
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        )
      }

      console.log('Starting QrScanner on existing video...')
      if (qrScannerRef.current) {
        await qrScannerRef.current.start()
        console.log('QrScanner.start() completed')
      }
      
      // Устанавливаем состояние
      setIsScanning(true)
      setIsInitialized(true)
      setError(null)
      console.log('Scanner started successfully with manual stream')
      
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

    return () => {
      mountedRef.current = false
      safeStop()
    }
  }, [safeStop])

  const handleClose = async () => {
    mountedRef.current = false
    await safeStop()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    {!userStarted ? (
                      <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">Нажмите кнопку для запуска камеры</p>
                        <button
                          onClick={handleUserStart}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                        >
                          📷 Запустить камеру
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Запуск камеры...</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
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
                  <span className="text-green-600 text-xs">Камера активна</span>
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
