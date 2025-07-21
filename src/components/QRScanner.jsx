// src/components/QRScanner.jsx
import React, { useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const QRScanner = ({ onScan }) => {
  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader")
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        onScan(decodedText)
        scanner.stop()
      },
      (errorMessage) => {
        // можно скрыть, чтобы не мешал: console.log(errorMessage)
      }
    )

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  return <div id="qr-reader" style={{ width: "100%" }} />
}

export default QRScanner