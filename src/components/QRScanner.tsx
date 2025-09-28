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

    try {
      setError(null)
      setIsInitialized(false)

      // Проверяем, находимся ли мы в Telegram WebApp
      const isTelegramWebApp = typeof window !== 'undefined' && (window as any).Telegram?.WebApp
      if (isTelegramWebApp) {
        console.log('Running in Telegram WebApp - camera access may be limited')
      }

      // Ставим playsinline ещё раз на случай iOS webview
      try {
        if (videoRef.current) {
          videoRef.current.setAttribute('playsinline', 'true')
        }
      } catch (e) {
        console.warn('Failed to set playsinline', e)
      }

      // Проверяем камеру
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setError('Камера не найдена. Введите код вручную.')
        return
      }

      // Очищаем предыдущий сканер
      await safeStop()

      // Попытка 1: QrScanner с минимальными настройками
      try {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          handleScan,
          {
            maxScansPerSecond: 1,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            // убрал принудительный preferredCamera, чтобы не ломался на некоторых устройствах
          }
        )

        await qrScannerRef.current.start()
        setIsScanning(true)
        setIsInitialized(true)
        setError(null)
        return

      } catch (err) {
        console.warn('QrScanner.start() failed, trying fallback getUserMedia', err)
        
        // fallback: попробуем напрямую getUserMedia и назначить stream в video
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          })
          
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          
          // создаём QrScanner поверх уже запущенного видео (QrScanner может использовать существующий video элемент)
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            handleScan,
            {
              maxScansPerSecond: 1,
              highlightScanRegion: false,
            }
          )
          
          await qrScannerRef.current.start()
          setIsScanning(true)
          setIsInitialized(true)
          setError(null)
          return

        } catch (err2) {
          console.error('Fallback getUserMedia failed', err2)
          
          // в зависимости от ошибки даём дружелюбную подсказку
          const em = err2 instanceof Error ? err2.message : String(err2)
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
      }

    } catch (err) {
      console.error('Scanner initialization error:', err)
      setError('Ошибка инициализации камеры.')
      setIsScanning(false)
      setIsInitialized(false)
    }
  }, [handleScan, safeStop])

  const restartScanner = useCallback(async () => {
    await safeStop()
    await initScanner()
  }, [initScanner, safeStop])

  // Start/stop button for mobile - user gesture
  const handleUserStart = async () => {
    setUserStarted(true)
    setError(null)
    await initScanner()
  }

  // ВАЖНО: обработка visibilitychange - стоп/старт при скрытии/появлении
  useEffect(() => {
    const onVis = async () => {
      if (document.hidden) {
        // когда минимизирован - останавливаем сканер, чтобы WebView не сбросил поток
        await safeStop()
      } else {
        // когда появляется - если пользователь уже запустил, пытаемся восстановить
        if (userStarted) {
          await initScanner()
        }
      }
    }
    
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [initScanner, safeStop, userStarted])

  useEffect(() => {
    mountedRef.current = true
    // не запускаем автоматически, будет запускаться только после userStarted (см. ниже)
    if (userStarted) initScanner()

    return () => {
      mountedRef.current = false
      safeStop()
    }
  }, [initScanner, safeStop, userStarted])

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
                style={{ display: isInitialized ? 'block' : 'none' }}
              />
              {!isInitialized && !error && (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Камера не запущена</p>
                    <button
                      onClick={handleUserStart}
                      className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Запустить
                    </button>
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
              : 'Подготовка камеры...'
            }
          </p>
          {isScanning && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-xs">Камера активна</span>
            </div>
          )}
        </div>

            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={restartScanner}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                🔄 Перезапустить
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
