"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Terminal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FooterModalContent {
  title: string;
  body: string;
}

const footerContent: Record<string, FooterModalContent> = {
  // Platform
  "AutoFix Engine": {
    title: "AutoFix Engine",
    body: "NexusOps AutoFix Engine automatically detects production incidents by monitoring your logs and telemetry. When an anomaly is detected, the engine cross-references your entire codebase and Git history to propose a high-confidence root-cause patch — opening a PR within seconds, before your pager even fires. It supports Prisma, Redis, PostgreSQL, and 30+ other adapters out of the box.",
  },
  "Memory Context": {
    title: "Memory Context",
    body: "Every pull request, postmortem, architecture decision, and Slack conversation is automatically indexed and stored in NexusOps' Deep Memory system. When a new incident occurs, Nexus recalls past context — what failed before, how it was fixed, and what changed since — so it can make better decisions and give your team richer context instantly.",
  },
  Integrations: {
    title: "Integrations",
    body: "NexusOps integrates natively with GitHub, GitLab, Slack, PagerDuty, Datadog, Sentry, Vercel, Railway, and 40+ other tools. Zero-config adapters stream logs, traces, and Git history into Nexus. Enterprise customers can also build custom integrations via the REST API and webhooks.",
  },
  Pricing: {
    title: "Pricing",
    body: "NexusOps offers a generous free tier for small teams (up to 5 seats, 50 incidents/month). The Pro plan ($29/seat/month) includes unlimited incidents, AutoFix PRs, and priority support. Enterprise pricing includes self-hosted deployments, SSO/SAML, SOC2 compliance, and dedicated SRE support. All plans include a 14-day free trial.",
  },
  Changelog: {
    title: "Changelog",
    body: "v2.4 (Latest) — Autonomous PR Drafting: Nexus can now draft and open pull requests without human intervention. v2.3 — Multi-model routing layer with support for Anthropic, OpenAI, and Bedrock. v2.2 — GitLab and Bitbucket private beta. v2.1 — Deep Memory Context indexing for Slack and Notion. v2.0 — Complete platform rewrite with Bauhaus design system.",
  },
  // Resources
  Documentation: {
    title: "Documentation",
    body: "Comprehensive guides for setting up NexusOps, configuring integrations, and building custom workflows. Our documentation covers everything from quick-start tutorials to advanced API reference, webhook configuration, and self-hosted deployment guides. Visit docs.nexusops.io for the full reference.",
  },
  "API Reference": {
    title: "API Reference",
    body: "NexusOps exposes a RESTful API for programmatic access to incidents, patches, memory queries, and team management. All endpoints support JSON request/response formats, API key authentication, and rate limiting. SDKs are available for TypeScript, Python, Go, and Ruby.",
  },
  Blog: {
    title: "Blog",
    body: "Engineering insights from the NexusOps team. Recent posts: 'How We Reduced MTTR by 18x with Multi-Model Reasoning', 'Building a Production-Grade Incident Memory System', 'Why Your On-Call Rotation Needs an AI Copilot', and 'Lessons from Processing 10M Incidents'.",
  },
  Community: {
    title: "Community",
    body: "Join the NexusOps community on Discord (5,000+ members), GitHub Discussions, and our monthly 'Ops Hour' livestreams. Share incident war stories, contribute integrations, and get early access to beta features. Community contributors get free Pro access.",
  },
  Status: {
    title: "System Status",
    body: "NexusOps maintains a 99.98% uptime SLA. Current status: All systems operational. API response time: 42ms (p95). AutoFix Engine: Online. Memory Indexer: Online. Webhook delivery: 99.99% success rate. Check status.nexusops.io for real-time monitoring.",
  },
  // Company
  About: {
    title: "About NexusOps",
    body: "NexusOps was founded in 2024 by a team of ex-Google, ex-Datadog, and ex-PagerDuty engineers who were tired of manual incident response. Our mission: give every engineering team a senior SRE that never sleeps. Headquartered in San Francisco, with remote-first engineering teams across 12 countries.",
  },
  Customers: {
    title: "Customers",
    body: "NexusOps is trusted by engineering teams at Vercel, Linear, Stripe, Railway, Supabase, and 200+ other companies. Our customers report an average 92% reduction in manual incident handling, 18x faster triage, and significantly happier on-call engineers.",
  },
  Careers: {
    title: "Careers",
    body: "We're hiring! Open roles: Senior ML Engineer (Incident Classification), Staff Backend Engineer (Rust/Go), Product Designer, and Developer Advocate. We offer competitive compensation, equity, unlimited PTO, and the chance to build the future of production operations. Apply at careers.nexusops.io.",
  },
  "Terms of Service": {
    title: "Terms of Service",
    body: "By using NexusOps, you agree to our Terms of Service. Key points: Your data remains yours. We process telemetry metadata for incident analysis but never store raw PII unless explicitly configured. Enterprise customers can self-host for full data sovereignty. Data retention: 90 days on free tier, unlimited on Pro/Enterprise. Full terms available at nexusops.io/terms.",
  },
  "Privacy Policy": {
    title: "Privacy Policy",
    body: "NexusOps is committed to privacy. We collect only the minimum data necessary to provide our service. We do not sell or share your data with third parties. SOC2 Type II certified. GDPR compliant. All data encrypted at rest (AES-256) and in transit (TLS 1.3). Full privacy policy at nexusops.io/privacy.",
  },
};

function FooterLink({
  label,
  hoverColor,
  onOpen,
}: {
  label: string;
  hoverColor: string;
  onOpen: (label: string) => void;
}) {
  return (
    <li>
      <button
        onClick={() => onOpen(label)}
        className={`text-foreground font-bold text-sm text-left transition-all ${hoverColor}`}
      >
        {label}
      </button>
    </li>
  );
}

export function Footer() {
  const [modalContent, setModalContent] = useState<FooterModalContent | null>(
    null
  );

  const openModal = (label: string) => {
    const content = footerContent[label];
    if (content) setModalContent(content);
  };

  return (
    <>
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
                The next-generation command center for engineering teams.
                Automate incident response, leverage architectural memory, and
                deploy with absolute confidence.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/soumyachk101/NexusOps-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white border-[3px] border-foreground flex items-center justify-center shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary-blue transition-all group"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 fill-foreground group-hover:fill-white"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white border-[3px] border-foreground flex items-center justify-center shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary-red transition-all group"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 fill-foreground group-hover:fill-white"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">
                Platform
              </h4>
              <ul className="space-y-4">
                <FooterLink
                  label="AutoFix Engine"
                  hoverColor="hover:bg-primary-yellow hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Memory Context"
                  hoverColor="hover:bg-primary-yellow hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Integrations"
                  hoverColor="hover:bg-primary-yellow hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Pricing"
                  hoverColor="hover:bg-primary-yellow hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Changelog"
                  hoverColor="hover:bg-primary-yellow hover:px-2"
                  onOpen={openModal}
                />
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">
                Resources
              </h4>
              <ul className="space-y-4">
                <FooterLink
                  label="Documentation"
                  hoverColor="hover:bg-primary-blue hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="API Reference"
                  hoverColor="hover:bg-primary-blue hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Blog"
                  hoverColor="hover:bg-primary-blue hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Community"
                  hoverColor="hover:bg-primary-blue hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Status"
                  hoverColor="hover:bg-primary-blue hover:text-white hover:px-2"
                  onOpen={openModal}
                />
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-black text-xs tracking-widest mb-6 uppercase border-b-[3px] border-foreground pb-2 inline-block">
                Company
              </h4>
              <ul className="space-y-4">
                <FooterLink
                  label="About"
                  hoverColor="hover:bg-primary-red hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Customers"
                  hoverColor="hover:bg-primary-red hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Careers"
                  hoverColor="hover:bg-primary-red hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Terms of Service"
                  hoverColor="hover:bg-primary-red hover:text-white hover:px-2"
                  onOpen={openModal}
                />
                <FooterLink
                  label="Privacy Policy"
                  hoverColor="hover:bg-primary-red hover:text-white hover:px-2"
                  onOpen={openModal}
                />
              </ul>
            </div>
          </div>

          <div className="mt-8 border-[3px] border-foreground bg-primary-yellow px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-bauhaus-sm">
            <p className="text-foreground font-black text-[10px] tracking-widest uppercase">
              © {new Date().getFullYear()} NEXUSOPS. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-2 text-foreground font-black text-[10px] uppercase">
              <Terminal className="w-4 h-4" />
              <span>
                SYSTEM STATUS:{" "}
                <span className="bg-white text-foreground px-2 py-0.5 border-2 border-foreground ml-1">
                  OPTIMAL
                </span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      <AnimatePresence>
        {modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setModalContent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-background border-4 border-foreground shadow-bauhaus-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-primary-yellow border-b-4 border-foreground">
                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                  {modalContent.title}
                </h3>
                <button
                  onClick={() => setModalContent(null)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {modalContent.body}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => setModalContent(null)}
                  className="w-full py-3 bg-foreground text-background font-black uppercase tracking-widest text-sm border-4 border-foreground hover:bg-primary-blue transition-all shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
