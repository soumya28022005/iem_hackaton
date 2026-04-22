import Link from "next/link";
import { Activity } from "lucide-react";
import { motion, useScroll } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-4 inset-x-0 z-50 mx-auto max-w-5xl px-4 sm:px-6 transition-all duration-300 ${
        isScrolled ? "py-2" : "py-4"
      }`}
    >
      <div className={`relative flex items-center justify-between px-6 py-3 md:py-4 transition-all duration-300 ${
        isScrolled 
          ? "bg-background border-4 border-foreground shadow-bauhaus-md" 
          : "bg-transparent border-4 border-transparent"
      }`}>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-primary-red border-[3px] border-foreground shadow-bauhaus-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-foreground tracking-widest hidden sm:block uppercase">
            Nexus
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 relative z-10">
          <Link href="#architecture" className="text-sm font-bold text-foreground hover:text-primary-blue hover:underline decoration-2 underline-offset-4 transition-all">
            Architecture
          </Link>
          <Link href="#features" className="text-sm font-bold text-foreground hover:text-primary-red hover:underline decoration-2 underline-offset-4 transition-all">
            Features
          </Link>
          <Link href="#faq" className="text-sm font-bold text-foreground hover:text-primary-yellow hover:underline decoration-2 underline-offset-4 transition-all">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <Link 
            href="/login" 
            className="text-sm font-bold text-foreground hover:text-primary-blue transition-colors hidden sm:block"
          >
            Terminal Login
          </Link>
          <Link 
            href="/login" 
            className="bg-primary-yellow text-foreground font-bold text-sm px-6 py-2 border-[3px] border-foreground shadow-bauhaus-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
          >
            <span className="tracking-wider uppercase">Initiate</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
