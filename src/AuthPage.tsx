import React, { useState } from "react";
import { authApi } from "./api/api";

interface AuthPageProps {
  onSuccess: (user: { name: string; phone: string }) => void;
  onClose?: () => void;
}

type Mode = "login" | "register";

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<Mode>("login");

  // Login
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

  const EMAIL_DOMAINS = ["gmail.com", "mail.ru", "yandex.ru", "outlook.com", "icloud.com", "yahoo.com"];

  const emailSuggestions = (() => {
    if (!regEmail) return [];
    const at = regEmail.indexOf("@");
    if (at === -1) return EMAIL_DOMAINS.map(d => `${regEmail}@${d}`);
    const local = regEmail.slice(0, at);
    const domainPart = regEmail.slice(at + 1);
    if (!local) return [];
    return EMAIL_DOMAINS
      .filter(d => d !== domainPart && d.startsWith(domainPart))
      .map(d => `${local}@${d}`);
  })();

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 9);
    let out = "";
    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length > 2) out += " " + digits.slice(2, 5);
    if (digits.length > 5) out += " " + digits.slice(5, 7);
    if (digits.length > 7) out += " " + digits.slice(7, 9);
    return out;
  };

  const handleLogin = async () => {
    const digits = loginPhone.replace(/\D/g, "");
    if (digits.length < 9) { setLoginError("Telefon raqamni to'liq kiriting"); return; }
    if (!loginPassword) { setLoginError("Parolni kiriting"); return; }
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await authApi.login("+998" + digits, loginPassword);
      onSuccess({ name: data.user.name, phone: data.user.phone });
    } catch (err: any) {
      setLoginError(err.message || "Telefon yoki parol noto'g'ri");
    } finally {
      setLoginLoading(false);
    }
  };

  const validateReg = () => {
    const errs: Record<string, string> = {};
    if (regName.trim().length < 2) errs.name = "Ism kamida 2 ta harf bo'lsin";
    if (regEmail && !/\S+@\S+\.\S+/.test(regEmail)) errs.email = "Email noto'g'ri formatda";
    if (regPhone.replace(/\D/g, "").length < 9) errs.phone = "Telefon raqamni to'liq kiriting";
    if (regPassword.length < 6) errs.password = "Parol kamida 6 ta belgi bo'lsin";
    if (regPassword !== regConfirm) errs.confirm = "Parollar mos kelmadi";
    return errs;
  };

  const handleRegister = async () => {
    const errs = validateReg();
    if (Object.keys(errs).length > 0) { setRegErrors(errs); return; }
    setRegErrors({});
    setRegLoading(true);
    try {
      const digits = regPhone.replace(/\D/g, "");
      const data = await authApi.register({
        name: regName.trim(),
        phone: "+998" + digits,
        email: regEmail || undefined,
        password: regPassword,
      });
      onSuccess({ name: data.user.name, phone: data.user.phone });
    } catch (err: any) {
      setRegErrors({ general: err.message || "Ro'yxatdan o'tishda xatolik" });
    } finally {
      setRegLoading(false);
    }
  };

  const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {msg}
      </p>
    ) : null;

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="text-gray-400 hover:text-gray-600 ml-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        {show
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
        }
      </svg>
    </button>
  );

  // Parol kuchini baholash: 0 (bo'sh) — 1 (kuchsiz) — 2 (o'rta) — 3 (kuchli)
  const passwordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (pwd.length >= 8 && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 3);
  };

  const STRENGTH_META = [
    { label: "", color: "" },
    { label: "Kuchsiz", color: "bg-red-400" },
    { label: "O'rta", color: "bg-amber-400" },
    { label: "Kuchli", color: "bg-green-500" },
  ];

  const regStrength = passwordStrength(regPassword);

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

        {/* Tab */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {(["login", "register"] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setLoginError(""); setRegErrors({}); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {m === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/80 border border-gray-100 p-7">

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Xush kelibsiz!</h1>
                <p className="text-sm text-gray-400">Hisobingizga kiring</p>
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Telefon raqam</label>
                <div className={`flex items-center gap-2 border-2 rounded-2xl px-4 py-3 transition-all ${loginError ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                  <span className="text-base">🇺🇿</span>
                  <span className="text-sm font-bold text-gray-700">+998</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <input type="tel" value={loginPhone}
                    onChange={e => { setLoginPhone(formatPhone(e.target.value)); setLoginError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="90 123 45 67" autoFocus
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Parol</label>
                <div className={`flex items-center border-2 rounded-2xl px-4 py-3 transition-all ${loginError ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                  <input type={showLoginPwd ? "text" : "password"} value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                  <EyeBtn show={showLoginPwd} toggle={() => setShowLoginPwd(v => !v)} />
                </div>
                <ErrMsg msg={loginError} />
              </div>

              <button onClick={handleLogin} disabled={loginLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                {loginLoading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Kirilmoqda...</>) : "Kirish →"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-5">
                Hisobingiz yo'qmi?{" "}
                <button onClick={() => setMode("register")} className="text-orange-500 font-semibold hover:underline">Ro'yxatdan o'ting</button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Yangi hisob</h1>
                <p className="text-sm text-gray-400">Ma'lumotlaringizni kiriting</p>
              </div>

              {regErrors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500">{regErrors.general}</div>}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Ism va familiya</label>
                  <div className={`flex items-center gap-2.5 border-2 rounded-2xl px-4 py-3 transition-all ${regErrors.name ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input type="text" value={regName}
                      onChange={e => { setRegName(e.target.value); setRegErrors(p => ({...p, name: ""})); }}
                      placeholder="Jasur Toshmatov"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                  </div>
                  <ErrMsg msg={regErrors.name} />
                </div>

                {/* Email */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email <span className="text-gray-300 normal-case font-normal">(ixtiyoriy)</span></label>
                  <div className={`flex items-center gap-2.5 border-2 rounded-2xl px-4 py-3 transition-all ${regErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input type="email" value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({...p, email: ""})); setShowEmailDropdown(true); }}
                      onFocus={() => setShowEmailDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEmailDropdown(false), 150)}
                      placeholder="example@gmail.com"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                  </div>
                  {showEmailDropdown && emailSuggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-100 overflow-hidden max-h-52 overflow-y-auto">
                      {emailSuggestions.map(sugg => (
                        <li key={sugg}>
                          <button type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setRegEmail(sugg); setShowEmailDropdown(false); setRegErrors(p => ({...p, email: ""})); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                            {sugg}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <ErrMsg msg={regErrors.email} />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Telefon raqam</label>
                  <div className={`flex items-center gap-2 border-2 rounded-2xl px-4 py-3 transition-all ${regErrors.phone ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                    <span className="text-base">🇺🇿</span>
                    <span className="text-sm font-bold text-gray-700">+998</span>
                    <div className="w-px h-4 bg-gray-200" />
                    <input type="tel" value={regPhone}
                      onChange={e => { setRegPhone(formatPhone(e.target.value)); setRegErrors(p => ({...p, phone: ""})); }}
                      placeholder="90 123 45 67"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                  </div>
                  <ErrMsg msg={regErrors.phone} />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Parol</label>
                  <div className={`flex items-center border-2 rounded-2xl px-4 py-3 transition-all ${regErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input type={showRegPwd ? "text" : "password"} value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({...p, password: ""})); }}
                      placeholder="Kamida 6 ta belgi"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                    <EyeBtn show={showRegPwd} toggle={() => setShowRegPwd(v => !v)} />
                  </div>
                  {regPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= regStrength ? STRENGTH_META[regStrength].color : "bg-gray-100"}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${regStrength === 1 ? "text-red-500" : regStrength === 2 ? "text-amber-500" : regStrength === 3 ? "text-green-600" : "text-gray-400"}`}>
                        {STRENGTH_META[regStrength].label}
                      </span>
                    </div>
                  )}
                  <ErrMsg msg={regErrors.password} />
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Parolni tasdiqlang</label>
                  <div className={`flex items-center border-2 rounded-2xl px-4 py-3 transition-all ${regErrors.confirm ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-orange-400 bg-gray-50 focus-within:bg-white"}`}>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input type={showRegConfirm ? "text" : "password"} value={regConfirm}
                      onChange={e => { setRegConfirm(e.target.value); setRegErrors(p => ({...p, confirm: ""})); }}
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                      placeholder="Parolni qayta kiriting"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                    {regConfirm && regPassword === regConfirm ? (
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <EyeBtn show={showRegConfirm} toggle={() => setShowRegConfirm(v => !v)} />
                    )}
                  </div>
                  <ErrMsg msg={regErrors.confirm} />
                </div>
              </div>

              <button onClick={handleRegister} disabled={regLoading}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                {regLoading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Ro'yxatdan o'tilmoqda...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-7a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>Ro'yxatdan o'tish</>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-300 mt-4">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Ma'lumotlaringiz xavfsiz saqlanadi
              </p>

              <p className="text-center text-xs text-gray-400 mt-3">
                Hisobingiz bormi?{" "}
                <button onClick={() => setMode("login")} className="text-orange-500 font-semibold hover:underline">Kirish</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
