import React, { useEffect, useRef, useState } from "react";
import { authApi } from "./api/api";

interface AuthPageProps {
  onSuccess: (user: { name: string; email: string }) => void;
  onClose?: () => void;
}

type Step = "email" | "code";

const RESEND_COOLDOWN = 45;

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") setTimeout(() => codeInputRef.current?.focus(), 50);
  }, [step]);

  const sendCode = async () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email manzilni to'g'ri kiriting");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.requestCode(email.trim().toLowerCase());
      setStep("code");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Kod yuborishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await authApi.requestCode(email.trim().toLowerCase());
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Kod yuborishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError("6 xonali kodni to'liq kiriting");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.verifyCode(email.trim().toLowerCase(), code, name.trim() || undefined);
      onSuccess({ name: data.user.name, email: data.user.email });
    } catch (err: any) {
      setError(err.message || "Kod noto'g'ri yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(val.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-100 opacity-60" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-orange-50 opacity-80" />
      </div>

      <div className="w-full max-w-md relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-2 right-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shadow-sm z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            Build<span className="text-orange-500">Finder</span>
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/80 border border-gray-100 p-7">
          {step === "email" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Xush kelibsiz!</h1>
                <p className="text-sm text-gray-400">Email manzilingizni kiriting — tasdiqlash kodi yuboramiz</p>
              </div>

              <div className="mb-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                <div className={`flex items-center gap-2.5 border-2 rounded-2xl px-4 py-3 transition-all ${error ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && sendCode()}
                    placeholder="example@gmail.com"
                    autoFocus
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={sendCode}
                disabled={loading}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Yuborilmoqda...</>
                ) : "Kod yuborish →"}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-300 mt-4">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Parol kerak emas — faqat email va kod
              </p>
            </div>
          )}

          {step === "code" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Kodni kiriting</h1>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-600">{email}</span> manziliga 6 xonali kod yubordik
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tasdiqlash kodi</label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  placeholder="000000"
                  maxLength={6}
                  className={`w-full text-center text-2xl font-bold tracking-[0.5em] border-2 rounded-2xl px-4 py-3.5 transition-all focus:outline-none ${error ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 focus:border-orange-400 bg-gray-50 focus:bg-white text-gray-800"}`}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Ismingiz <span className="text-gray-300 normal-case font-normal">(birinchi marta kirsangiz)</span>
                </label>
                <div className="flex items-center gap-2.5 border-2 border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white rounded-2xl px-4 py-3 transition-all">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                    placeholder="Jasur Toshmatov"
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={verifyCode}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Tekshirilmoqda...</>
                ) : "Tasdiqlash →"}
              </button>

              <div className="flex items-center justify-between mt-4 text-xs">
                <button
                  onClick={() => { setStep("email"); setCode(""); setError(""); }}
                  className="text-gray-400 hover:text-gray-600 font-medium"
                >
                  ← Emailni o'zgartirish
                </button>
                <button
                  onClick={resendCode}
                  disabled={cooldown > 0 || loading}
                  className={`font-semibold ${cooldown > 0 ? "text-gray-300 cursor-not-allowed" : "text-orange-500 hover:underline"}`}
                >
                  {cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : "Kodni qayta yuborish"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
