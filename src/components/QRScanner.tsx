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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initScanner = async () => {
      if (!videoRef.current || !mounted) return

      try {
        setError(null)

        // Проверяем камеру
        const hasCamera = await QrScanner.hasCamera()
        if (!hasCamera) {
          setError('Камера не найдена')
          return
        }

        // Создаем сканер
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (mounted) {
              onScan(result.data)
            }
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 1,
          }
        )

        // Запускаем сканер
        await qrScannerRef.current.start()

      } catch (err) {
        console.error('Scanner error:', err)
        if (mounted) {
          setError('Ошибка камеры')
        }
      }
    }

    initScanner()

    return () => {
      mounted = false
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    }
  }, [onScan])

  const handleClose = () => {
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
            className="w-full h-64 bg-gray-200 rounded-lg"
            playsInline
            autoPlay
            muted
          />
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

        <div className="mt-4 flex justify-center">
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
