'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CompanyInfo {
  sirenNumber: string;
  companyName: string;
  address: string;
  activityCode: string;
  activityLabel: string;
}

interface SelectedCommune {
  nom: string;
  code: string;
  codePostal: string;
  coordinates: [number, number]; // [lng, lat]
}

interface UploadedDocument {
  type: 'id' | 'kbis' | 'insurance';
  file: File;
  name: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  password: string;
  confirmPassword: string;
  description: string;
  nafCode: string;
  nafLabel: string;
  serviceAreas: SelectedCommune[];
  documents: UploadedDocument[];
}

interface SirenError {
  message: string;
}

export default function ProfessionalRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sirenInput, setSirenInput] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [sirenError, setSirenError] = useState<SirenError | null>(null);
  const [sirenLoading, setSirenLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    emailVerified: false,
    phone: '',
    password: '',
    confirmPassword: '',
    description: '',
    nafCode: '',
    nafLabel: '',
    serviceAreas: [],
    documents: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [communeQuery, setCommuneQuery] = useState('');
  const [communeSuggestions, setCommuncSuggestions] = useState<any[]>([]);
  const [communeLoading, setCommuneLoading] = useState(false);
  const [showCommuncDropdown, setShowCommuneDropdown] = useState(false);
  const communeInputRef = useRef<HTMLInputElement>(null);
  const communeDropdownRef = useRef<HTMLDivElement>(null);

  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // SIREN Verification
  const handleSirenVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sirenInput.trim()) {
      setSirenError({ message: 'Veuillez entrer un numéro SIREN' });
      return;
    }

    setSirenLoading(true);
    setSirenError(null);

    try {
      // Call API to verify SIREN
      const response = await fetch('/api/verify-siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren: sirenInput }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSirenError({
          message: data.message || 'SIREN invalide ou introuvable',
        });
        setSirenLoading(false);
        return;
      }

      const data = await response.json();
      setCompanyInfo({
        sirenNumber: sirenInput,
        companyName: data.companyName,
        address: data.address,
        activityCode: data.activityCode,
        activityLabel: data.activityLabel,
      });

      setFormData((prev) => ({
        ...prev,
        nafCode: data.activityCode,
        nafLabel: data.activityLabel,
      }));

      setCurrentStep(2);
    } catch (error) {
      setSirenError({
        message: 'Erreur lors de la vérification du SIREN',
      });
    } finally {
      setSirenLoading(false);
    }
  };

  // Commune Autocomplete
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (communeQuery.length > 1) {
        fetchCommuneSuggestions();
      } else {
        setCommuncSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [communeQuery]);

  const fetchCommuneSuggestions = async () => {
    setCommuneLoading(true);
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(communeQuery)}&fields=nom,code,codesPostaux,centre&boost=population&limit=7`
      );
      if (response.ok) {
        const data = await response.json();
        setCommuncSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching communes:', error);
    } finally {
      setCommuneLoading(false);
    }
  };

  const handleSelectCommune = (commune: any) => {
    const newCommune: SelectedCommune = {
      nom: commune.nom,
      code: commune.code,
      codePostal: commune.codesPostaux?.[0] || '',
      coordinates: commune.centre?.coordinates || [0, 0],
    };

    const isDuplicate = formData.serviceAreas.some(
      (c) => c.code === commune.code
    );

    if (!isDuplicate) {
      setFormData((prev) => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, newCommune],
      }));
    }

    setCommuneQuery('');
    setCommuncSuggestions([]);
    setShowCommuneDropdown(false);
  };

  const handleRemoveCommune = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((c) => c.code !== code),
    }));
  };

  // NAF Code Lookup
  const handleNafCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nafCode = e.target.value.trim();
    setFormData((prev) => ({
      ...prev,
      nafCode,
      nafLabel: '',
    }));

    if (nafCode.length >= 2) {
      try {
        const response = await fetch(
          `/api/naf?code=${encodeURIComponent(nafCode)}`
        );
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            nafLabel: data.label || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching NAF label:', error);
      }
    }
  };

  // Phone Validation
  const validatePhoneNumber = (phone: string): boolean => {
    const frenchPhoneRegex =
      /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8}|[0-9]{9})$/;
    return frenchPhoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handlePhoneBlur = () => {
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setPhoneError('Format invalide. Exemple: 06 12 34 56 78');
    } else {
      setPhoneError('');
    }
  };

  // Password Validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData((prev) => ({
      ...prev,
      password,
    }));

    if (formData.confirmPassword && password !== formData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const confirmPassword = e.target.value;
    setFormData((prev) => ({
      ...prev,
      confirmPassword,
    }));

    if (confirmPassword && formData.password !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
    } else {
      setPasswordError('');
    }
  };

  // Email OTP
  const handleSendOtp = async () => {
    if (!formData.email) {
      setOtpError('Veuillez entrer une adresse email');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          type: 'email',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setOtpError(data.message || 'Erreur lors de l\'envoi du code');
        setOtpLoading(false);
        return;
      }

      setOtpSent(true);
      setOtpEmail(formData.email);
    } catch (error) {
      setOtpError('Erreur lors de l\'envoi du code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpError('Veuillez entrer le code de vérification');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail,
          code: otpCode,
          type: 'email',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setOtpError(data.message || 'Code invalide');
        setOtpLoading(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        emailVerified: true,
      }));
      setOtpCode('');
    } catch (error) {
      setOtpError('Erreur lors de la vérification du code');
    } finally {
      setOtpLoading(false);
    }
  };

  // Document Upload
  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'id' | 'kbis' | 'insurance'
  ) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const newDoc: UploadedDocument = {
        type: docType,
        file,
        name: file.name,
      };

      setFormData((prev) => {
        const filtered = prev.documents.filter((d) => d.type !== docType);
        return {
          ...prev,
          documents: [...filtered, newDoc],
        };
      });
    }
  };

  const handleRemoveDocument = (docType: 'id' | 'kbis' | 'insurance') => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.type !== docType),
    }));
  };

  // Validation
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    }
    if (!formData.emailVerified) {
      errors.email = 'Veuillez vérifier votre email';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.description.trim()) {
      errors.description = 'La description est requise';
    }
    if (formData.serviceAreas.length === 0) {
      errors.serviceAreas = 'Sélectionnez au moins une zone d\'intervention';
    }
    if (formData.documents.length === 0) {
      errors.documents = 'Veuillez télécharger au moins un document';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append('sirenNumber', companyInfo?.sirenNumber || '');
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('nafCode', formData.nafCode);
      formDataToSend.append('nafLabel', formData.nafLabel);
      formDataToSend.append(
        'serviceAreas',
        JSON.stringify(formData.serviceAreas)
      );

      // Add documents
      formData.documents.forEach((doc) => {
        formDataToSend.append(`document_${doc.type}`, doc.file);
      });

      const response = await fetch('/api/register/professional', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        setSubmitError(data.message || 'Erreur lors de l\'inscription');
        setSubmitLoading(false);
        return;
      }

      // Success - redirect
      window.location.href = '/register/success';
    } catch (error) {
      setSubmitError('Erreur lors de l\'inscription');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inscription Professionnel
          </h1>
          <p className="text-gray-600">Rejoignez ProLink en tant que professionnel</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <div className="text-xs font-semibold text-gray-600 ml-2">
                {step === 1 && 'Vérification'}
                {step === 2 && 'Informations'}
                {step === 3 && 'Finalisation'}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: SIREN Verification */}
        {currentStep === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Vérification du SIREN
            </h2>

            <form onSubmit={handleSirenVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numéro SIREN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sirenInput}
                  onChange={(e) => setSirenInput(e.target.value)}
                  placeholder="Entrez votre numéro SIREN (9 chiffres)"
                  className="input-field"
                />
                {sirenError && (
                  <p className="text-red-500 text-sm mt-2">{sirenError.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={sirenLoading}
                className="btn-primary w-full"
              >
                {sirenLoading ? 'Vérification en cours...' : 'Vérifier le SIREN'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Information & Documents */}
        {currentStep === 2 && companyInfo && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Informations & Documents
            </h2>

            {/* Company Info Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Entreprise :</span>{' '}
                {companyInfo.companyName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">SIREN :</span>{' '}
                {companyInfo.sirenNumber}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Votre prénom"
                  className="input-field"
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Votre nom"
                  className="input-field"
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.lastName}
                  </p>
                )}
              </div>

              {/* Email with OTP Verification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="votre.email@example.com"
                    className="input-field flex-1"
                    disabled={formData.emailVerified}
                  />
                  {!formData.emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpSent}
                      className="btn-secondary"
                    >
                      {otpSent ? 'Code envoyé' : 'Vérifier'}
                    </button>
                  )}
                  {formData.emailVerified && (
                    <div className="flex items-center px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
                      <span className="text-green-600 font-semibold">✓</span>
                    </div>
                  )}
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* OTP Code Input */}
              {otpSent && !formData.emailVerified && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code de vérification <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="input-field flex-1 text-center tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="btn-primary"
                    >
                      {otpLoading ? 'Vérification...' : 'Valider'}
                    </button>
                  </div>
                  {otpError && (
                    <p className="text-red-500 text-sm mt-1">{otpError}</p>
                  )}
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  onBlur={handlePhoneBlur}
                  placeholder="06 12 34 56 78"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 06 12 34 56 78
                </p>
                {(phoneError || formErrors.phone) && (
                  <p className="text-red-500 text-sm mt-1">
                    {phoneError || formErrors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="Entrez un mot de passe sécurisé"
                  className="input-field"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirmez votre mot de passe"
                  className="input-field"
                />
                {(passwordError || formErrors.confirmPassword) && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordError || formErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description professionnelle{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Décrivez votre activité et expertise"
                  rows={4}
                  className="input-field"
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* NAF Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code NAF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nafCode}
                  onChange={handleNafCodeChange}
                  placeholder="Ex: 7120B"
                  className="input-field"
                />
                {formData.nafLabel && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold">Activité :</span>{' '}
                    {formData.nafLabel}
                  </p>
                )}
              </div>

              {/* Service Areas (Communes) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone d&apos;intervention{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={communeInputRef}
                    type="text"
                    value={communeQuery}
                    onChange={(e) => {
                      setCommuneQuery(e.target.value);
                      setShowCommuneDropdown(true);
                    }}
                    onFocus={() => setShowCommuneDropdown(true)}
                    placeholder="Rechercher une commune..."
                    className="input-field"
                  />

                  {/* Communes Dropdown */}
                  {showCommuncDropdown && communeSuggestions.length > 0 && (
                    <div
                      ref={communeDropdownRef}
                      className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto mt-1"
                    >
                      {communeLoading && (
                        <div className="p-4 text-center text-gray-500">
                          Chargement...
                        </div>
                      )}
                      {!communeLoading &&
                        communeSuggestions.map((commune) => (
                          <div
                            key={commune.code}
                            onClick={() => handleSelectCommune(commune)}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              {commune.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {commune.codesPostaux?.join(', ') || 'N/A'}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selected Communes */}
                {formData.serviceAreas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formData.serviceAreas.map((commune) => (
                      <div
                        key={commune.code}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 border border-indigo-300 rounded-full"
                      >
                        <span className="text-sm font-medium text-indigo-900">
                          {commune.nom} ({commune.codePostal})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommune(commune.code)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formErrors.serviceAreas && (
                  <p className="text-red-500 text-sm mt-2">
                    {formErrors.serviceAreas}
                  </p>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents <span className="text-red-500">*</span>
                </h3>

                {/* ID Document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Carte d&apos;identité <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-id"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleDocumentUpload(e, 'id')}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-id"
                      className="btn-secondary cursor-pointer"
                    >
                      Télécharger
                    </label>
                    {formData.documents.find((d) => d.type === 'id') && (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-gray-700">
                          ✓{' '}
                          {
                            formData.documents.find((d) => d.type === 'id')
                              ?.name
                          }
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument('id')}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* KBIS Document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Extrait KBIS <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-kbis"
                      accept=".pdf"
                      onChange={(e) => handleDocumentUpload(e, 'kbis')}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-kbis"
                      className="btn-secondary cursor-pointer"
                    >
                      Télécharger
                    </label>
                    {formData.documents.find((d) => d.type === 'kbis') && (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-gray-700">
                          ✓{' '}
                          {
                            formData.documents.find((d) => d.type === 'kbis')
                              ?.name
                          }
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument('kbis')}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insurance Document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attestation d&apos;assurance{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-insurance"
                      accept=".pdf"
                      onChange={(e) => handleDocumentUpload(e, 'insurance')}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-insurance"
                      className="btn-secondary cursor-pointer"
                    >
                      Télécharger
                    </label>
                    {formData.documents.find((d) => d.type === 'insurance') && (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-gray-700">
                          ✓{' '}
                          {
                            formData.documents.find((d) => d.type === 'insurance')
                              ?.name
                          }
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument('insurance')}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {formErrors.documents && (
                  <p className="text-red-500 text-sm mt-2">
                    {formErrors.documents}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setCompanyInfo(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                  className="btn-primary flex-1"
                >
                  Continuer
                </button>
              </div>

              {submitError && (
                <p className="text-red-500 text-sm text-center">
                  {submitError}
                </p>
              )}
            </form>
          </div>
        )}

        {/* Step 3: Review & Finalization */}
        {currentStep === 3 && companyInfo && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Vérification et Finalisation
            </h2>

            <div className="space-y-6">
              {/* Review Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Entreprise
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {companyInfo.companyName}
                  </p>
                  <p className="text-sm text-gray-600">SIREN: {companyInfo.sirenNumber}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Contact
                  </h3>
                  <p className="text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{formData.email}</p>
                  <p className="text-sm text-gray-600">{formData.phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Zones d&apos;intervention
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceAreas.map((area) => (
                      <span
                        key={area.code}
                        className="inline-block px-2 py-1 bg-indigo-100 text-indigo-900 rounded text-sm"
                      >
                        {area.nom}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Documents
                  </h3>
                  <ul className="space-y-2">
                    {formData.documents.map((doc) => (
                      <li key={doc.type} className="text-sm text-gray-600">
                        ✓ {doc.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Email Verification Status */}
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  formData.emailVerified
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-yellow-50 border border-yellow-300'
                }`}
              >
                <span
                  className={`text-xl ${
                    formData.emailVerified ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {formData.emailVerified ? '✓' : '!'}
                </span>
                <p
                  className={`text-sm font-medium ${
                    formData.emailVerified ? 'text-green-900' : 'text-yellow-900'
                  }`}
                >
                  {formData.emailVerified
                    ? 'Email vérifié avec succès'
                    : 'Email en attente de vérification'}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="border-t pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary flex-1"
                >
                  Retour aux informations
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading || !formData.emailVerified}
                  className="btn-primary flex-1"
                >
                  {submitLoading ? 'Inscription en cours...' : 'Confirmer l\'inscription'}
                </button>
              </div>

              {submitError && (
                <p className="text-red-500 text-sm text-center">{submitError}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Vous avez déjà un compte?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
