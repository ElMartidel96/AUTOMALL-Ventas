'use client';

/**
 * EMAIL VERIFICATION MODAL
 *
 * Handles email verification during the SalesMasterclass flow.
 * Uses real OTP verification via /api/email/send-verification and /api/email/verify-code
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  giftId?: string;
  tokenId?: string;
  source?: string;
  title?: string;
  subtitle?: string;
  walletAddress?: string;
}

type VerificationStep = 'email' | 'code' | 'verified';

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  walletAddress
}) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<VerificationStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setEmail('');
      setOtpCode(['', '', '', '', '', '']);
      setError(null);
      setCountdown(0);
    }
  }, [isOpen]);

  // Send OTP code
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email valido');
      return;
    }

    // Wallet is optional for email verification during educational flow
    // The wallet will be connected AFTER completing the education requirements
    const wallet = walletAddress || localStorage.getItem('connectedWallet') || 'pending-verification';

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, wallet }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.rateLimited) {
          setError(`Demasiados intentos. Espera ${Math.ceil(data.retryAfter / 60)} minutos.`);
        } else {
          setError(data.error || 'Error al enviar codigo');
        }
        return;
      }

      // Move to code verification step
      setStep('code');
      setCountdown(60); // 60 second cooldown before resend

      // Focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error('Send verification error:', err);
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      handleVerifyCode(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtpCode(newOtp);
      handleVerifyCode(pastedData);
    }
  };

  // Verify OTP code
  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || otpCode.join('');

    if (codeToVerify.length !== 6) {
      setError('Ingresa el codigo completo de 6 digitos');
      return;
    }

    // Wallet is optional for email verification during educational flow
    // The wallet will be connected AFTER completing the education requirements
    const wallet = walletAddress || localStorage.getItem('connectedWallet') || 'pending-verification';

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: codeToVerify,
          wallet
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Codigo invalido');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Success!
      setStep('verified');
      setTimeout(() => {
        onVerified(email);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Verify code error:', err);
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        /* Modal only closes via X button or successful verification - not by clicking outside */
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STEP: VERIFIED */}
          {step === 'verified' && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verificado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tu email ha sido verificado correctamente
              </p>
            </div>
          )}

          {/* STEP: CODE VERIFICATION */}
          {step === 'code' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Ingresa el Codigo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enviamos un codigo de 6 digitos a
                </p>
                <p className="text-purple-600 dark:text-purple-400 font-medium">
                  {email}
                </p>
              </div>

              <div className="space-y-4">
                {/* OTP Input */}
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <button
                  onClick={() => handleVerifyCode()}
                  disabled={isLoading || otpCode.some(d => !d)}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verificando...
                    </span>
                  ) : (
                    'Verificar Codigo'
                  )}
                </button>

                {/* Resend code */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Reenviar codigo en {countdown}s
                    </p>
                  ) : (
                    <button
                      onClick={() => handleSendCode()}
                      disabled={isLoading}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center mx-auto gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reenviar codigo
                    </button>
                  )}
                </div>

                {/* Change email */}
                <button
                  onClick={() => {
                    setStep('email');
                    setOtpCode(['', '', '', '', '', '']);
                    setError(null);
                  }}
                  className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2 text-sm"
                >
                  Cambiar email
                </button>
              </div>
            </>
          )}

          {/* STEP: EMAIL INPUT */}
          {step === 'email' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Verificar Email
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ingresa tu email para recibir informacion exclusiva
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Codigo'
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailVerificationModal;
