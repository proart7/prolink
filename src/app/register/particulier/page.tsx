'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Commune {
  nom: string;
  code: string;
  codesPostaux: string[];
  centre: {
    coordinates: [number, number];
  };
}

export default function RegisterParticulier() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [commune, setCommune] = useState('');
  const [communeData, setCommuneData] = useState<Commune | null>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email OTP state
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Commune autocomplete state
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [showCommunes, setShowCommunes] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const [communeLoading, setCommuneLoading] = useState(false);

  // Password strength
  const getPasswordStrength = useCallback((pwd: string): 'weak' | 'medium' | 'strong' => {
    if (!pwd) return 'weak';
    if (pwd.length < 8) return 'weak';
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*]/.test(pwd);

    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial].filter(Boolean).length;

    if (score >= 3 && pwd.length >= 12) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  }, []);

  // Commune autocomplete
  const fetchCommunes = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCommunes([]);
      setShowCommunes(false);
      return;
    }

    setCommuneLoading(true);
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,centre&boost=population&limit=7`
      );
      const data = await response.json();
      setCommunes(data);
      setShowCommunes(true);
    } catch (err) {
      console.error('Error fetching communes:', err);
      setCommunes([]);
    } finally {
      setCommuneLoading(false);
    }
  }, []);

  const handleCommuneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommune(value);
    setCommuneData(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchCommunes(value);
    }, 300);
  };

  const selectCommune = (selectedCommune: Commune) => {
    setCommune(selectedCommune.nom);
    setCommuneData(selectedCommune);
    setCommunes([]);
    setShowCommunes(false);
  };

  // Phone validation
  const validatePhone = (phoneValue: string) => {
    const cleanPhone = phoneValue.replace(/\s/g, '');
    const isValid = /^(06|07)\d{8}$/.test(cleanPhone);

    if (phoneValue && !isValid) {
      setPhoneError('Format: 06 12 34 56 78');
    } else {
      setPhoneError('');
    }

    return isValid || !phoneValue;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');

    // Auto-format phone number
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = `${value.slice(0, 2)} ${value.slice(2)}`;
      } else if (value.length <= 6) {
        value = `${value.slice(0, 2)} ${value.slice(2, 4)} ${value.slice(4)}`;
      } else if (value.length <= 8) {
        value = `${value.slice(0, 2)} ${value.slice(2, 4)} ${value.slice(4, 6)} ${value.slice(6)}`;
      } else {
        value = `${value.slice(0, 2)} ${value.slice(2, 4)} ${value.slice(4, 6)} ${value.slice(6, 8)} ${value.slice(8, 10)}`;
      }
    }

    setPhone(value);
  };

  const handlePhoneBlur = () => {
    validatePhone(phone);
  };

  // Email OTP
  const sendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOtpError('Veuillez entrer une adresse email valide');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email' }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du code');
      }

      setShowOtpInput(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Veuillez entrer un code Ã  6 chiffres');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, type: 'email' }),
      });

      if (!response.ok) {
        throw new Error('Code invalide ou expirÃ©');
      }

      setEmailVerified(true);
      setShowOtpInput(false);
      setOtp('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Erreur lors de la vÃ©rification');
    } finally {
      setOtpLoading(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'PrÃ©nom requis';
    if (!lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!phone.trim()) {
      newErrors.phone = 'TÃ©lÃ©phone requis';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Format invalide (06 ou 07)';
    }
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Au moins 8 caractÃ¨res';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!commune.trim()) {
      newErrors.commune = 'Commune requise';
    }
    if (!emailVerified) {
      newErrors.emailVerification = 'Email non vÃ©rifiÃ©';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Veuillez corriger les erreurs ci-dessous');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const [longitude, latitude] = communeData?.centre.coordinates || [0, 0];
      const postalCode = communeData?.codesPostaux?.[0] || '';

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: cleanPhone,
          password,
          commune: commune.trim(),
          communeCode: communeData?.code || '',
          postalCode,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      setSuccess('Inscription rÃ©ussie! Redirection...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };
  const strengthText = {
    weak: 'Faible',
    medium: 'Moyen',
    strong: 'Fort',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ProLink</h1>
            <p className="text-gray-600">CrÃ©ez votre compte particulier</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {errors.emailVerification && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              Veuillez vÃ©rifier votre adresse email avant de continuer
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PrÃ©nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PrÃ©nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                className={`input-field w-full ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className={`input-field w-full ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>

            {/* Email avec OTP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  disabled={emailVerified}
                  className={`input-field flex-1 ${errors.email ? 'border-red-500' : ''} ${
                    emailVerified ? 'bg-green-50' : ''
                  }`}
                />
                {emailVerified ? (
                  <div className="flex items-center justify-center px-4 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpLoading || !email}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {otpLoading ? 'Envoi...' : 'VÃ©rifier'}
                  </button>
                )}
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}

              {/* OTP Input */}
              {showOtpInput && !emailVerified && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-2">
                    Entrez le code de vÃ©rification envoyÃ© Ã  {email}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="input-field flex-1 text-center text-2xl tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      className="btn-primary whitespace-nowrap"
                    >
                      {otpLoading ? 'VÃ©rif...' : 'VÃ©rifier'}
                    </button>
                  </div>
                  {otpError && <p className="text-red-500 text-xs mt-2">{otpError}</p>}
                </div>
              )}
            </div>

            {/* TÃ©lÃ©phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TÃ©lÃ©phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                placeholder="06 12 34 56 78"
                maxLength={14}
                className={`input-field w-full ${errors.phone || phoneError ? 'border-red-500' : ''}`}
              />
              <p className="text-gray-500 text-xs mt-1">Format: 06 ou 07 suivi de 8 chiffres</p>
              {(errors.phone || phoneError) && (
                <p className="text-red-500 text-xs mt-1">{errors.phone || phoneError}</p>
              )}
            </div>

            {/* Commune */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commune <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={commune}
                  onChange={handleCommuneChange}
                  onFocus={() => commune && setShowCommunes(true)}
                  placeholder="Commencez Ã  taper..."
                  className={`input-field w-full ${
                    errors.commune ? 'border-red-500' : ''
                  } ${communeData ? 'bg-green-50' : ''}`}
                />
                {communeLoading && (
                  <div className="absolute right-3 top-3 text-gray-400">
                    <div className="animate-spin">â</div>
                  </div>
                )}
                {communeData && (
                  <div className="absolute right-3 top-3 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {showCommunes && communes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {communes.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => selectCommune(c)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{c.nom}</div>
                        <div className="text-xs text-gray-500">{c.codesPostaux.join(', ')}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.commune && <p className="text-red-500 text-xs mt-1">{errors.commune}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
                  className={`input-field w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? 'ð' : 'ðâð¨'}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColor[passwordStrength]} transition-all`}
                        style={{
                          width:
                            passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{strengthText[passwordStrength]}</span>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
                  className={`input-field w-full pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? 'ð' : 'ðâð¨'}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !emailVerified}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Inscription en cours...' : 'CrÃ©er mon compte'}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Vous avez un compte?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
