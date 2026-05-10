"use client";

import { useActionState, useEffect } from "react";
import { loginAction } from "@/app/actions/auth";
import { LogIn, ShieldAlert, KeyRound, Mail, Leaf } from "lucide-react";
import {
  ADMIN_TAB_SESSION_KEY,
  ADMIN_TAB_SESSION_VALUE,
} from "@/lib/admin-tab-session";

export function LoginFormClient({ hotelName }: { hotelName: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

  useEffect(() => {
    if (state?.error) {
      sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
    }
  }, [state?.error]);

  const handleSubmit = () => {
    sessionStorage.setItem(ADMIN_TAB_SESSION_KEY, ADMIN_TAB_SESSION_VALUE);
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#faf7f0]">
      
      {/* ─── BRANDING / COVER SECTION (Mobile Top / Desktop Left) ─── */}
      <div className="relative flex flex-col justify-center items-center p-8 lg:p-12 w-full lg:w-1/2 min-h-[35vh] lg:min-h-screen bg-[#1a3c2a] overflow-hidden">
        {/* Soft Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#2d5a3f] rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#c9a84c] rounded-full mix-blend-screen filter blur-[120px] opacity-20" />
        
        {/* Actual Content */}
        <div className="relative z-10 flex flex-col items-center text-center text-[#faf7f0]">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
            <Leaf className="w-8 h-8 md:w-10 md:h-10 text-[#f5e6c8]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight mb-4">
            {hotelName}
          </h1>
          <p className="text-[#c4b9a8] tracking-[0.2em] uppercase text-sm md:text-base font-medium">
            Management Portal
          </p>
        </div>
      </div>

      {/* ─── LOGIN FORM SECTION (Mobile Bottom / Desktop Right) ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 bg-[#faf7f0] rounded-t-3xl -mt-6 lg:mt-0 lg:rounded-none relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none">
        
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-serif text-[#1a3c2a] mb-2">Welcome Back</h2>
            <p className="text-[#8b7355] text-sm md:text-base">Please enter your credentials to continue.</p>
          </div>

          <form action={action} onSubmit={handleSubmit} className="space-y-6">
            {state?.error && (
              <div className="p-4 bg-[#fdf2f2] text-[#ef4444] text-sm rounded-xl border border-[#fca5a5] flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#2c2c2c] mb-2"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#a89279]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-2 focus:ring-[#1a3c2a]/20 focus:border-[#1a3c2a] transition-all outline-none text-[#2c2c2c] placeholder-[#c4b9a8] shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#2c2c2c] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#a89279]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-2 focus:ring-[#1a3c2a]/20 focus:border-[#1a3c2a] transition-all outline-none text-[#2c2c2c] placeholder-[#c4b9a8] shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#1a3c2a] hover:bg-[#0f2418] text-[#f5e6c8] font-medium py-4 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-[0.1em] text-sm mt-8"
            >
              {pending ? (
                <span className="w-5 h-5 border-2 border-[#f5e6c8]/30 border-t-[#f5e6c8] rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <p className="text-xs text-[#9c8f7a] flex items-center justify-center lg:justify-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Authorized personnel only. All access is logged.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
