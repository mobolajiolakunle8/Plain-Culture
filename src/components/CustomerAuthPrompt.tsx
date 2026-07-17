import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { X, UserPlus, LogIn } from "lucide-react";

interface CustomerAuthPromptProps {
  disabled?: boolean;
  onAddToast?: (text: string, type: "success" | "error" | "info") => void;
}

export const CustomerAuthPrompt: React.FC<CustomerAuthPromptProps> = ({ disabled = false, onAddToast }) => {
  const { user, login, signUp, signInWithGoogle, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (disabled || user) return;
    if (sessionStorage.getItem("pc_customer_auth_skipped")) return;
    const timer = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(timer);
  }, [disabled, user]);

  const skip = () => {
    sessionStorage.setItem("pc_customer_auth_skipped", "true");
    setVisible(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      onAddToast?.("Please complete the required fields.", "error");
      return;
    }
    const ok = mode === "signup"
      ? await signUp(form.email.trim(), form.password, form.name.trim())
      : await login(form.email.trim(), form.password);
    if (ok) {
      onAddToast?.(mode === "signup" ? "Account created successfully." : "Signed in successfully.", "success");
      setVisible(false);
    } else {
      onAddToast?.("Could not authenticate. Please check your details.", "error");
    }
  };

  const google = async () => {
    const ok = await signInWithGoogle();
    if (ok) {
      onAddToast?.("Signed in with Google.", "success");
      setVisible(false);
    } else {
      onAddToast?.("Google sign-in failed. Please try again.", "error");
    }
  };

  if (!visible || disabled || user) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-900">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
              {mode === "signup" ? "Join Plain Culture" : "Welcome Back"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Optional account for faster future checkout.</p>
          </div>
          <button onClick={skip} className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <button
            type="button"
            onClick={google}
            disabled={isLoading}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-black dark:text-white"
              />
            )}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-black dark:text-white"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-black dark:text-white"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 cursor-pointer"
            >
              {mode === "signup" ? <><UserPlus className="inline w-4 h-4 mr-2" /> Create Account</> : <><LogIn className="inline w-4 h-4 mr-2" /> Sign In</>}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-xs text-zinc-500 hover:text-black dark:hover:text-white font-bold uppercase tracking-wider"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
          </button>

          <button
            type="button"
            onClick={skip}
            className="w-full py-2 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold uppercase tracking-widest"
          >
            Skip for now and continue shopping
          </button>
        </div>

        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-500 text-center">
          You can still checkout without signing up. Your cart stays available on this device.
        </div>
      </div>
    </div>
  );
};