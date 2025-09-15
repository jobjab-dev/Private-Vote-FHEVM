/**
 * Toast Notification Component for transaction status
 */

'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
  show: boolean;
  onClose: () => void;
  transactionHash?: string;
}

export default function NotificationToast({ 
  message, 
  type, 
  duration = 5000, 
  show, 
  onClose,
  transactionHash 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = 'fixed bottom-4 left-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 max-w-sm';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-900 border-green-600 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-900 border-red-600 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-900 border-yellow-600 text-yellow-100`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-900 border-blue-600 text-blue-100`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${getToastStyles()} ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {transactionHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-300 hover:text-blue-200 underline mt-1 block"
            >
              View on Explorer ↗
            </a>
          )}
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
