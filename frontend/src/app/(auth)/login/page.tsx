"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, User, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (searchParams?.get("mode") === "register") {
      setIsLogin(false);
      setEmail("");
      setPassword("");
    }
  }, [searchParams]);

  const toggleMode = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowShutter(true);
    setError("");

    // After shutter closes
    setTimeout(() => {
      setIsLogin(!isLogin);
      // Let React render the new state behind the shutter, then open shutter
      setTimeout(() => {
        setShowShutter(false);
        setTimeout(() => setIsAnimating(false), 500);
      }, 50);
    }, 400); // Shutter close duration
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await credential.user.getIdToken();
        const res = await signIn("firebase", { redirect: false, idToken });
        if (res?.error) setError("Authentication failed. Check your credentials.");
        else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        const idToken = await credential.user.getIdToken();
        const res = await signIn("firebase", { redirect: false, idToken });
        if (res?.error) setError("Registration completed, but automatic login failed.");
        else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "System error. Please try again later.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "github" | "google") => {
    setIsLoading(true);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetStatus("sending");
    setResetError("");
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail.trim());
      setResetStatus("sent");
    } catch (err: unknown) {
      setResetStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      // Clean up Firebase error messages
      if (msg.includes("auth/user-not-found")) {
        setResetError("No account found with this email.");
      } else if (msg.includes("auth/invalid-email")) {
        setResetError("Invalid email address.");
      } else if (msg.includes("auth/too-many-requests")) {
        setResetError("Too many attempts. Please try again later.");
      } else {
        setResetError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 lg:p-8 font-sans overflow-hidden relative">
      {/* Bauhaus Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary-yellow rounded-full border-4 border-foreground bauhaus-shadow-md hidden lg:block" />
      <div className="absolute bottom-20 left-20 w-48 h-12 bg-primary-blue border-4 border-foreground bauhaus-shadow-md hidden lg:block -rotate-12" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-primary-red border-4 border-foreground bauhaus-shadow-md hidden lg:block" />
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-background border-4 border-foreground rounded-full bauhaus-pattern-dots hidden lg:block" />

      <div className={`w-full max-w-[1000px] flex flex-col ${!isLogin ? "lg:flex-row-reverse" : "lg:flex-row"} border-4 border-foreground bauhaus-shadow-lg bg-background relative z-10 transition-all duration-500 overflow-hidden`}>
        
        {/* Shutter Overlay */}
        <AnimatePresence>
          {showShutter && (
            <motion.div
              initial={{ scaleX: 0, transformOrigin: isLogin ? "left" : "right" }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0, transformOrigin: isLogin ? "right" : "left" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 z-50 bg-foreground flex flex-col items-center justify-center border-x-8 border-primary-red"
            >
              <div className="flex gap-6 items-center">
                <div className="w-10 h-10 bg-primary-yellow rounded-full border-4 border-background animate-bounce" />
                <div className="w-10 h-10 bg-primary-blue border-4 border-background animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-10 h-10 bg-primary-red rotate-45 border-4 border-background animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aesthetic Panel */}
        <div className={`w-full lg:w-1/2 p-12 border-b-4 lg:border-b-0 ${isLogin ? 'lg:border-r-4' : 'lg:border-l-4'} border-foreground flex flex-col justify-between ${isLogin ? 'bg-primary-yellow' : 'bg-primary-blue'} transition-colors duration-500`}>
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <div className="w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center bauhaus-shadow-sm group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all">
                <span className="font-black text-xl leading-none tracking-tighter">NX</span>
              </div>
            </Link>
            <div className="px-3 py-1 bg-background border-2 border-foreground font-bold text-sm uppercase">
              {isLogin ? 'AUTH_SEQ' : 'NEW_NODE'}
            </div>
          </div>

          <div className="mt-16 mb-8">
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              {isLogin ? "Welcome\nBack" : "Join The\nNetwork"}
            </h1>
            <p className="text-foreground/80 font-medium text-lg leading-snug max-w-sm border-l-4 border-foreground pl-4">
              {isLogin 
                ? "Authenticate your credentials to access the NexusOps command center."
                : "Register a new identity to participate in the automated infrastructure."}
            </p>
          </div>
          
          <div className="w-full h-2 bg-foreground" />
        </div>

        {/* Form Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 bg-background">
          <div className="w-full max-w-md mx-auto">
            
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                {isLogin ? "Sign In" : "Register"}
              </h2>
              <button 
                onClick={toggleMode} 
                className="text-sm font-bold uppercase underline hover:text-primary-red transition-colors"
              >
                {isLogin ? "Create Account" : "Login Instead"}
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-primary-red text-background font-bold border-4 border-foreground flex items-start gap-2"
                  >
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-sm leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="font-bold text-sm uppercase">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-foreground" />
                    </div>
                    <input
                      id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-background border-4 border-foreground text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-0 focus:border-primary-red transition-colors font-bold"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-sm uppercase">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <input
                    id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-background border-4 border-foreground text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-0 focus:border-primary-red transition-colors font-bold"
                    placeholder="user@nexusops.ai"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-sm uppercase">Password</label>
                  {isLogin && (
                    <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(email); setResetStatus("idle"); setResetError(""); }} className="text-xs font-bold uppercase underline hover:text-primary-red">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-foreground" />
                  </div>
                  <input
                    id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-background border-4 border-foreground text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-0 focus:border-primary-red transition-colors font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 py-3 px-4 border-4 border-foreground text-background font-black uppercase tracking-widest transition-all disabled:opacity-50 ${isLogin ? "bg-primary-red" : "bg-primary-blue"} bauhaus-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none active:bg-foreground`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-4 border-background/30 border-t-background animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Authenticate" : "Register Identity"} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-1 flex-1 bg-foreground" />
              <span className="font-black text-xs uppercase tracking-widest">
                OR USE OAUTH
              </span>
              <div className="h-1 flex-1 bg-foreground" />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleOAuthLogin("github")} disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 py-3 px-4 bg-background border-4 border-foreground font-black uppercase transition-all hover:bg-foreground hover:text-background bauhaus-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
              >
                <GithubIcon className="w-5 h-5" /> GitHub
              </button>
              <button
                onClick={() => handleOAuthLogin("google")} disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 py-3 px-4 bg-background border-4 border-foreground font-black uppercase transition-all hover:bg-foreground hover:text-background bauhaus-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
              >
                <GoogleIcon className="w-5 h-5" /> Google
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-background border-4 border-foreground bauhaus-shadow-lg p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Reset Password</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-foreground hover:bg-foreground hover:text-background transition-all font-black"
                >
                  ✕
                </button>
              </div>

              {resetStatus === "sent" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-blue text-background border-4 border-foreground">
                    <p className="font-bold text-sm">PASSWORD RESET EMAIL SENT</p>
                    <p className="text-sm mt-1 text-background/80">Check your inbox for <strong>{resetEmail}</strong>. Follow the link to create a new password.</p>
                  </div>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full py-3 bg-foreground text-background font-black uppercase tracking-widest border-4 border-foreground hover:bg-primary-yellow hover:text-foreground transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <p className="text-foreground/70 font-medium text-sm border-l-4 border-foreground pl-3">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>

                  {resetError && (
                    <div className="p-3 bg-primary-red text-background font-bold border-4 border-foreground flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <span className="text-sm leading-tight">{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-sm uppercase">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-foreground" />
                      </div>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-background border-4 border-foreground text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-0 focus:border-primary-red transition-colors font-bold"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 py-3 bg-background border-4 border-foreground font-black uppercase tracking-widest hover:bg-bg-elevated transition-all bauhaus-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetStatus === "sending"}
                      className="flex-1 py-3 bg-primary-red text-background border-4 border-foreground font-black uppercase tracking-widest hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all bauhaus-shadow-sm disabled:opacity-50"
                    >
                      {resetStatus === "sending" ? (
                        <div className="w-5 h-5 mx-auto rounded-full border-4 border-background/30 border-t-background animate-spin" />
                      ) : (
                        "Send Link"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
