"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react'
import QrScanner from 'qr-scanner'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
  onManualInput?: () => void
}

export default function QRScanner({ onScan, onClose, onManualInput }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userStarted, setUserStarted] = useState(false) // Новый флаг для user gesture
  const [requestingPermission, setRequestingPermission] = useState(false) // Флаг запроса разрешения
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

  const initScanner = useCallback(async () => {
    if (!videoRef.current || !mountedRef.current) return

    // Предотвращаем множественные запуски
    if (isScanning || isInitialized) {
      console.log('Scanner already running, skipping init')
      return
    }

    try {
      setError(null)
      setIsInitialized(false)

      // Проверяем, находимся ли мы в Telegram WebApp
      const isTelegramWebApp = typeof window !== 'undefined' && (window as any).Telegram?.WebApp
      if (isTelegramWebApp) {
        console.log('Running in Telegram WebApp - camera access may be limited')
      }

      // Настраиваем video элемент для мобильных устройств
      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('webkit-playsinline', 'true')
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        
        // Добавляем обработчики событий для принудительного отображения
        const video = videoRef.current
        
        const handleLoadedData = () => {
          console.log('Video loaded data')
          video.style.display = 'block'
          video.style.visibility = 'visible'
          video.style.opacity = '1'
        }
        
        const handleCanPlay = () => {
          console.log('Video can play')
          video.style.display = 'block'
          video.style.visibility = 'visible'
          video.style.opacity = '1'
        }
        
        const handlePlay = () => {
          console.log('Video playing')
          video.style.display = 'block'
          video.style.visibility = 'visible'
          video.style.opacity = '1'
        }
        
        video.addEventListener('loadeddata', handleLoadedData)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('play', handlePlay)
        
        // Очистка обработчиков при размонтировании
        return () => {
          video.removeEventListener('loadeddata', handleLoadedData)
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('play', handlePlay)
        }
      }

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

      // Сначала получаем видео поток принудительно
      console.log('Getting video stream manually first...')
      try {
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
        
        // Теперь создаем QrScanner поверх уже работающего видео
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          handleScan,
          {
            maxScansPerSecond: 1,
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        )

        console.log('Starting QrScanner on existing video...')
        await qrScannerRef.current.start()
        console.log('QrScanner.start() completed')
        
        // Устанавливаем состояние только после успешного запуска
        console.log('Setting states: isScanning=true, isInitialized=true')
        setIsScanning(true)
        setIsInitialized(true)
        setError(null)
        console.log('QrScanner started successfully with manual stream')
        
        return

      } catch (err) {
        console.error('Failed to get video stream:', err)
        
        // Обработка ошибок
        const em = err instanceof Error ? err.message : String(err)
        if (em.includes('NotAllowedError') || em.includes('permission')) {
          setError('Доступ к камере заблокирован. Разрешите в настройках Telegram / браузера.')
        } else if (em.includes('NotReadableError')) {
          setError('Камера занята другим приложением. Закройте другие приложения, использующие камеру.')
        } else {
          setError('Не удалось запустить камеру. Попробуйте ввести код вручную.')
        }
        setIsScanning(false)
        setIsInitialized(false)
      }

    } catch (err) {
      console.error('Scanner initialization error:', err)
      setError('Ошибка инициализации камеры.')
      setIsScanning(false)
      setIsInitialized(false)
    }
  }, [handleScan, safeStop, isScanning, isInitialized])

  const restartScanner = useCallback(async () => {
    await safeStop()
    await initScanner()
  }, [initScanner, safeStop])

  // Start/stop button for mobile - user gesture
  const handleUserStart = async () => {
    if (isScanning || isInitialized) {
      console.log('Scanner already running, ignoring start request')
      return
    }
    
    console.log('User started scanner')
    setUserStarted(true)
    setError(null)
    
    // Сначала запрашиваем разрешение на камеру
    setRequestingPermission(true)
    try {
      console.log('Requesting camera permission...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      // Если разрешение получено, останавливаем поток и запускаем сканер
      stream.getTracks().forEach(track => track.stop())
      console.log('Camera permission granted, starting scanner...')
      setRequestingPermission(false)
      
      // Небольшая задержка для стабильности
      await new Promise(resolve => setTimeout(resolve, 200))
      
      await initScanner()
      
    } catch (error) {
      setRequestingPermission(false)
      console.error('Error requesting camera permission:', error)
      const em = error instanceof Error ? error.message : String(error)
      
      if (em.includes('NotAllowedError') || em.includes('permission')) {
        setError('Доступ к камере заблокирован. Разрешите доступ к камере в настройках браузера или Telegram.')
      } else if (em.includes('NotReadableError')) {
        setError('Камера занята другим приложением. Закройте другие приложения, использующие камеру.')
      } else if (em.includes('NotFoundError')) {
        setError('Камера не найдена. Убедитесь, что у вас есть камера.')
      } else {
        setError('Не удалось получить доступ к камере. Попробуйте ввести QR код вручную.')
      }
      
      setIsScanning(false)
      setIsInitialized(false)
    }
  }

  // ВАЖНО: обработка visibilitychange - стоп/старт при скрытии/появлении
  useEffect(() => {
    const onVis = async () => {
      if (document.hidden) {
        // когда минимизирован - останавливаем сканер, чтобы WebView не сбросил поток
        await safeStop()
      } else {
        // когда появляется - если пользователь уже запустил, пытаемся восстановить
        if (userStarted && isScanning) {
          await initScanner()
        }
      }
    }
    
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [initScanner, safeStop, userStarted, isScanning])

  useEffect(() => {
    mountedRef.current = true
    // НЕ запускаем автоматически - только по кнопке пользователя

    return () => {
      mountedRef.current = false
      safeStop()
    }
  }, [safeStop])

  // Принудительное обновление состояния видео при изменении isInitialized
  useEffect(() => {
    if (isInitialized && videoRef.current) {
      const video = videoRef.current as HTMLVideoElement
      video.style.display = 'block'
      video.style.visibility = 'visible'
      video.style.opacity = '1'
      console.log('useEffect: Video styles forced after isInitialized change')
    }
  }, [isInitialized])

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
                          disabled={requestingPermission}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
                        >
                          {requestingPermission ? '⏳ Запрос разрешения...' : '📷 Запустить камеру'}
                        </button>
                      </>
                    ) : requestingPermission ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Запрос разрешения на камеру...</p>
                        <p className="text-gray-500 text-xs mt-1">Разрешите доступ к камере в браузере</p>
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
            <p className="text-red-800 text-sm mb-2">{error}</p>
            <button
              onClick={restartScanner}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Попробовать снова
            </button>
          </div>
        )}

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                {isScanning 
                  ? 'Наведите камеру на QR код для сканирования' 
                  : requestingPermission
                    ? 'Запрос разрешения на камеру...'
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
              
              {/* Отладочная информация */}
              <div className="mt-2 text-xs text-gray-500">
                <p>Состояние: {isInitialized ? 'Инициализирован' : 'Не инициализирован'}</p>
                <p>Сканирование: {isScanning ? 'Активно' : 'Неактивно'}</p>
                <p>Пользователь запустил: {userStarted ? 'Да' : 'Нет'}</p>
                {videoRef.current && (
                  <>
                    <p>Видео стили: display={videoRef.current.style.display}, visibility={videoRef.current.style.visibility}</p>
                    <p>Видео поток: {(videoRef.current as HTMLVideoElement).srcObject ? 'Есть' : 'НЕТ'}</p>
                    <p>Видео размеры: {videoRef.current.style.width} x {videoRef.current.style.height}</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={restartScanner}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                🔄 Перезапустить
              </button>
              <button
                onClick={async () => {
                  console.log('Force restart button clicked')
                  await restartScanner()
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                🔧 Перезапустить
              </button>
              {onManualInput && (
                <button
                  onClick={onManualInput}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ✏️ Ввести вручную
                </button>
              )}
              <button
                onClick={handleClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Закрыть
              </button>
            </div>
      </div>
    </div>
  )
}
