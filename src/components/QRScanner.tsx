"use client"
import React, { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const startScanner = async () => {
      try {
        setError(null)
        setIsScanning(true)

        qrScannerRef.current = new QrScanner(
          videoRef.current!,
          (result) => {
            console.log('QR Code detected:', result.data)
            onScan(result.data)
            stopScanner()
          },
          {
            onDecodeError: (err) => {
              // Игнорируем ошибки декодирования, они нормальны
              console.log('QR decode error (normal):', err)
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Используем заднюю камеру
            maxScansPerSecond: 5, // Ограничиваем частоту сканирования
          }
        )

        await qrScannerRef.current.start()
        
        // Добавляем обработчик для предотвращения автоматической остановки
        const video = videoRef.current
        if (video) {
          video.addEventListener('loadedmetadata', () => {
            console.log('Camera loaded successfully')
            setError(null)
          })
          
          video.addEventListener('error', (e) => {
            console.error('Video error:', e)
            setError('Ошибка камеры. Попробуйте перезапустить сканер.')
          })
        }
      } catch (err) {
        console.error('Error starting QR scanner:', err)
        setError('Не удалось запустить камеру. Проверьте разрешения.')
        setIsScanning(false)
      }
    }

    const stopScanner = () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
      setIsScanning(false)
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [onScan])

  const handleClose = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsScanning(false)
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
            className="w-full h-64 bg-gray-200 rounded-lg"
            playsInline
          />
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Сканирование...</span>
                </div>
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
            Наведите камеру на QR код для сканирования
          </p>
        </div>

        <div className="mt-4 flex justify-center space-x-2">
          {error && (
            <button
              onClick={() => {
                setError(null)
                setIsScanning(false)
                if (qrScannerRef.current) {
                  qrScannerRef.current.stop()
                  qrScannerRef.current.destroy()
                  qrScannerRef.current = null
                }
                // Перезапускаем сканер
                setTimeout(() => {
                  if (videoRef.current) {
                    const stopScannerLocal = () => {
                      if (qrScannerRef.current) {
                        qrScannerRef.current.stop()
                        qrScannerRef.current.destroy()
                        qrScannerRef.current = null
                      }
                      setIsScanning(false)
                    }
                    
                    const startScanner = async () => {
                      try {
                        setError(null)
                        setIsScanning(true)
                        qrScannerRef.current = new QrScanner(
                          videoRef.current!,
                          (result) => {
                            console.log('QR Code detected:', result.data)
                            onScan(result.data)
                            stopScannerLocal()
                          },
                          {
                            onDecodeError: (err) => {
                              console.log('QR decode error (normal):', err)
                            },
                            highlightScanRegion: true,
                            highlightCodeOutline: true,
                            preferredCamera: 'environment',
                            maxScansPerSecond: 5,
                          }
                        )
                        await qrScannerRef.current.start()
                      } catch (err) {
                        console.error('Error restarting QR scanner:', err)
                        setError('Не удалось перезапустить камеру.')
                        setIsScanning(false)
                      }
                    }
                    startScanner()
                  }
                }, 100)
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              🔄 Перезапустить
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
