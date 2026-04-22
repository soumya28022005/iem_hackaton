import Link from "next/link";
import { Activity, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-background border-t-4 border-foreground pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 md:gap-8 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-red border-[3px] border-foreground flex items-center justify-center shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-foreground uppercase tracking-widest">
                NEXUS<span className="text-primary-blue">OPS</span>
              </span>
            </Link>
            <p className="text-sm font-bold text-foreground max-w-xs mb-6 leading-relaxed border-l-[3px] border-primary-yellow pl-4">
              The next-generation command center for engineering teams. Automate incident response, leverage architectural memory, and deploy with absolute confidence.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/soumyachk101/NexusOps-" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border-[3px] border-foreground flex items-center justify-center shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary-blue transition-all group">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground group-hover:fill-white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-white border-[3px] border-foreground flex items-center justify-center shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary-red transition-all group">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground group-hover:fill-white"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">Platform</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="#" className="text-foreground hover:bg-primary-yellow hover:px-2 transition-all">AutoFix Engine</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-yellow hover:px-2 transition-all">Memory Context</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-yellow hover:px-2 transition-all">Integrations</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-yellow hover:px-2 transition-all">Pricing</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-yellow hover:px-2 transition-all">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">Resources</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="#" className="text-foreground hover:bg-primary-blue hover:text-white hover:px-2 transition-all">Documentation</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-blue hover:text-white hover:px-2 transition-all">API Reference</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-blue hover:text-white hover:px-2 transition-all">Blog</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-blue hover:text-white hover:px-2 transition-all">Community</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-blue hover:text-white hover:px-2 transition-all">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">Company</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="#" className="text-foreground hover:bg-primary-red hover:text-white hover:px-2 transition-all">About</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-red hover:text-white hover:px-2 transition-all">Customers</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-red hover:text-white hover:px-2 transition-all">Careers</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-red hover:text-white hover:px-2 transition-all">Terms of Service</Link></li>
              <li><Link href="#" className="text-foreground hover:bg-primary-red hover:text-white hover:px-2 transition-all">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-[3px] border-foreground bg-primary-yellow px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-bauhaus-sm">
          <p className="text-foreground font-black text-[10px] tracking-widest uppercase">
            © {new Date().getFullYear()} NEXUSOPS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2 text-foreground font-black text-[10px] uppercase">
            <Terminal className="w-4 h-4" />
            <span>SYSTEM STATUS: <span className="bg-white text-foreground px-2 py-0.5 border-2 border-foreground ml-1">OPTIMAL</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

