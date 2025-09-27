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
  const mountedRef = useRef(true)

  const handleScan = useCallback((result: QrScanner.ScanResult) => {
    if (mountedRef.current && isScanning) {
      console.log('QR Code scanned:', result.data)
      onScan(result.data)
    }
  }, [onScan, isScanning])

  const initScanner = useCallback(async () => {
    if (!videoRef.current || !mountedRef.current) return

    try {
      setError(null)
      setIsInitialized(false)

      // Проверяем, находимся ли мы в Telegram WebApp
      const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram?.WebApp
      if (isTelegramWebApp) {
        console.log('Running in Telegram WebApp - camera access may be limited')
      }

      // Проверяем камеру
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setError('Камера не найдена. Убедитесь, что у вас есть камера и разрешения предоставлены.')
        return
      }

      // Очищаем предыдущий сканер
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }

      // Создаем новый сканер с более простыми настройками для Telegram
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleScan,
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 1,
          // Убираем подсветку для лучшей совместимости
          highlightScanRegion: false,
          highlightCodeOutline: false,
        }
      )

      // Запускаем сканер
      await qrScannerRef.current.start()

      // Устанавливаем состояние после успешного запуска
      setIsScanning(true)
      setIsInitialized(true)

    } catch (err) {
      console.error('Scanner initialization error:', err)
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
        
        // Специальные сообщения для разных типов ошибок
        if (errorMessage.includes('aborted') || errorMessage.includes('NotAllowedError')) {
          setError('Доступ к камере заблокирован. Разрешите доступ к камере в настройках браузера или попробуйте ввести QR код вручную.')
        } else if (errorMessage.includes('NotFoundError')) {
          setError('Камера не найдена. Убедитесь, что у вас есть камера.')
        } else if (errorMessage.includes('NotReadableError')) {
          setError('Камера занята другим приложением. Закройте другие приложения, использующие камеру.')
        } else {
          setError(`Ошибка инициализации камеры: ${errorMessage}`)
        }
      }
    }
  }, [handleScan])

  const restartScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        setIsScanning(false)
        await qrScannerRef.current.stop()
        await qrScannerRef.current.start()
        setIsScanning(true)
        setError(null)
      } catch (err) {
        console.error('Restart error:', err)
        setError('Ошибка перезапуска камеры')
        setIsScanning(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    initScanner()

    return () => {
      mountedRef.current = false
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    }
  }, [initScanner])

  const handleClose = () => {
    mountedRef.current = false
    setIsScanning(false)
    setIsInitialized(false)
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
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
                <p className="text-gray-600 text-sm">Инициализация камеры...</p>
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
            disabled={!isInitialized}
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
