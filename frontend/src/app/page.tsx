"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Zap,
  Database,
  TerminalSquare,
  ArrowRight,
  Sparkles,
  GitBranch,
  Activity,
  Lock,
  Gauge,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RevealText } from "@/components/ui/RevealText";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { AutoFixSimulator } from "@/components/landing/widgets/AutoFixSimulator";
import { SystemHealthRadar } from "@/components/landing/widgets/SystemHealthRadar";
import { DeepMemoryNetwork } from "@/components/landing/widgets/DeepMemoryNetwork";
import { OperationalTerminal } from "@/components/landing/widgets/OperationalTerminal";

const features = [
  {
    name: "AI-Powered AutoFix",
    description:
      "Detect incidents and ship patches autonomously — before your pager fires.",
    icon: Zap,
    component: AutoFixSimulator,
    size: "lg",
  },
  {
    name: "Deep Memory Context",
    description:
      "Every PR, postmortem, and architecture call — indexed and recall-ready.",
    icon: Database,
    component: DeepMemoryNetwork,
    size: "sm",
  },
  {
    name: "Intelligent Triage",
    description:
      "Severity scoring trained on your incident history. No more alert fatigue.",
    icon: Shield,
    component: SystemHealthRadar,
    size: "sm",
  },
  {
    name: "Operational Feed",
    description:
      "Transparent, real-time trace of every decision Nexus makes on your stack.",
    icon: TerminalSquare,
    component: OperationalTerminal,
    size: "md",
  },
];

const metrics = [
  { value: "92%", label: "Incidents auto-resolved" },
  { value: "4.2m", label: "Mean time to patch" },
  { value: "18×", label: "Faster triage vs. manual" },
  { value: "99.98%", label: "Platform uptime SLA" },
];

const logos = [
  "VERCEL",
  "LINEAR",
  "STRIPE",
  "DATADOG",
  "SUPABASE",
  "RAILWAY",
  "CLOUDFLARE",
];

const workflow = [
  {
    step: "01",
    title: "Ingest",
    body: "Stream logs, traces, and Git history into Nexus. Zero-config adapters for 40+ sources.",
    icon: Activity,
  },
  {
    step: "02",
    title: "Reason",
    body: "Deep-context model correlates symptoms to root cause using your codebase history.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Resolve",
    body: "Nexus drafts a PR, runs the test suite, and ships — with human-in-the-loop gates.",
    icon: GitBranch,
  },
];

const faqs = [
  {
    question: "How does the AutoFix Engine intercept production errors?",
    answer:
      "Nexus integrates directly into your logging cluster. When an anomaly is detected, the engine cross-references your entire GitHub history to propose a high-confidence root-cause patch within seconds.",
  },
  {
    question: "Is Nexus compliant with SOC2 and enterprise security?",
    answer:
      "Yes. The architecture evaluates telemetry metadata without exposing raw PII or secrets. Enterprise deployments are fully self-hostable on your VPC.",
  },
  {
    question: "Do you support Bitbucket and GitLab?",
    answer:
      "Deep GitHub integration ships natively with v2. GitLab and Bitbucket are in private beta for enterprise tier — contact sales for access.",
  },
  {
    question: "What models power Nexus reasoning?",
    answer:
      "A multi-model routing layer over frontier LLMs plus a fine-tuned severity classifier. You can also bring your own keys (Anthropic, OpenAI, Bedrock).",
  },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yHeroText = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityShader = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary-red selection:text-white">
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-foreground focus:text-background border-4 border-foreground"
      >
        Skip to content
      </a>

      {/* Scroll Progress Bar */}
      <motion.div
        role="progressbar"
        aria-label="Page scroll progress"
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-nexus-primary via-blue-400 to-nexus-primary z-[100] origin-left motion-reduce:hidden"
        style={{ scaleX }}
      />

      <Navbar />

      <main id="main">
      {/* ============ HERO (Centered, Dashboard-forward) ============ */}
      <section
        ref={containerRef}
        className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden border-b-4 border-foreground"
      >
        {/* Bauhaus Dotted Grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none bauhaus-pattern-dots opacity-20"
        />

        <motion.div
          style={{ y: yHeroText }}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Release pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="#features"
              className="group inline-flex items-center gap-2 px-4 py-2 bg-primary-yellow border-[3px] border-foreground text-foreground text-xs font-bold uppercase tracking-wider mb-10 shadow-bauhaus-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <span className="px-2 py-1 bg-foreground text-background text-[10px] font-bold">
                NEW
              </span>
              Nexus v2.4 — Autonomous PR Drafting
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden">
            <RevealText>
              <h1 className="text-[50px] sm:text-7xl lg:text-[100px] font-black text-foreground uppercase tracking-tighter leading-[0.85] mb-6">
                The Autopilot For
                <br />
                <span className="inline-block bg-primary-red text-background px-4 py-2 mt-4 border-4 border-foreground shadow-bauhaus-md transform -skew-x-6">
                  Production Incidents
                </span>
              </h1>
            </RevealText>
          </div>

          <RevealText delay={0.15}>
            <p className="max-w-2xl mx-auto text-base sm:text-xl text-foreground font-medium leading-relaxed mb-10 border-l-4 border-primary-blue pl-6 text-left bg-white p-4 border-[3px] shadow-bauhaus-sm">
              Nexus watches your logs, correlates failures against your
              codebase, and ships the fix. Your on-call rotation just got a
              senior engineer that never sleeps.
            </p>
          </RevealText>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12"
          >
            <Link
              href="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-background bg-foreground border-[3px] border-foreground shadow-bauhaus-md hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-primary-blue transition-all uppercase tracking-widest"
            >
              Deploy Nexus Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-foreground bg-background border-[3px] border-foreground shadow-bauhaus-md hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-primary-yellow transition-all uppercase tracking-widest"
            >
              <span className="w-6 h-6 border-[2px] border-foreground bg-white flex items-center justify-center group-hover:bg-primary-red transition-colors">
                <span className="block w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-foreground ml-1" />
              </span>
              Watch Demo
            </Link>
          </motion.div>


        </motion.div>

        {/* ========== Dashboard preview ========== */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-20 lg:mt-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative bg-background border-4 border-foreground shadow-bauhaus-lg">
            <div className="bg-white overflow-hidden border-foreground">
              {/* Browser chrome */}
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-foreground bg-primary-yellow">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-foreground" />
                  <div className="w-4 h-4 bg-foreground" />
                  <div className="w-4 h-4 bg-foreground" />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border-2 border-foreground text-[11px] font-bold text-foreground font-mono uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  app.nexusops.io/incidents
                </div>
                <span className="text-[10px] text-foreground font-bold font-mono inline-flex items-center gap-1.5 uppercase tracking-widest border-2 border-foreground bg-white px-2 py-1">
                  <span className="w-2 h-2 bg-primary-red animate-pulse border border-foreground" />
                  LIVE
                </span>
              </div>

              {/* Dashboard body */}
              <div className="grid grid-cols-12 gap-0 min-h-[380px] lg:min-h-[460px]">
                {/* Sidebar */}
                <aside className="hidden md:flex col-span-2 flex-col gap-2 p-4 border-r-4 border-foreground bg-background">
                  {[
                    { label: "Overview", active: false },
                    { label: "Incidents", active: true },
                    { label: "AutoFix", active: false },
                    { label: "Memory", active: false },
                    { label: "Settings", active: false },
                  ].map((i) => (
                    <div
                      key={i.label}
                      className={`text-[11px] px-3 py-2 font-bold uppercase tracking-wider border-2 ${
                        i.active
                          ? "bg-foreground text-background border-foreground"
                          : "text-foreground border-transparent hover:border-foreground hover:bg-white"
                      }`}
                    >
                      {i.label}
                    </div>
                  ))}
                </aside>

                {/* Main panel */}
                <div className="col-span-12 md:col-span-10 p-5 lg:p-7 flex flex-col gap-5">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { k: "Open incidents", v: "3", sub: "-2 vs yesterday", tone: "bg-primary-yellow" },
                      { k: "Auto-resolved", v: "47", sub: "+12% this week", tone: "bg-primary-red" },
                      { k: "MTTR", v: "4m 12s", sub: "-38% MoM", tone: "bg-primary-blue" },
                      { k: "PRs shipped", v: "128", sub: "18 today", tone: "bg-white" },
                    ].map((m) => (
                      <div
                        key={m.k}
                        className={`border-[3px] border-foreground shadow-bauhaus-sm px-4 py-3 ${m.tone}`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                          {m.k}
                        </div>
                        <div className="text-2xl font-black text-foreground mt-1">
                          {m.v}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-foreground border-t-2 border-foreground pt-1">
                          {m.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Incidents table */}
                  <div className="border-[3px] border-foreground bg-white overflow-hidden shadow-bauhaus-md">
                    <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-foreground bg-background">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-foreground" />
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                          Recent incidents
                        </span>
                      </div>
                      <span className="text-[10px] text-foreground font-bold font-mono uppercase tracking-widest">
                        auto-refresh · 5s
                      </span>
                    </div>
                    <div className="divide-y-[3px] divide-foreground">
                      {[
                        {
                          id: "INC-4821",
                          title: "Prisma query timeout on /users/:id",
                          sev: "P1",
                          sevClr: "bg-primary-red text-white",
                          status: "AutoFix running",
                          statusClr: "text-foreground font-bold uppercase",
                          time: "12s ago",
                          highlight: true,
                        },
                        {
                          id: "INC-4820",
                          title: "OOM on worker-queue-3",
                          sev: "P2",
                          sevClr: "bg-primary-yellow text-foreground",
                          status: "PR #4819 merged",
                          statusClr: "text-foreground font-bold uppercase",
                          time: "4m ago",
                        },
                        {
                          id: "INC-4817",
                          title: "429 spike from Stripe webhook",
                          sev: "P3",
                          sevClr: "bg-primary-blue text-white",
                          status: "Resolved",
                          statusClr: "text-foreground font-bold uppercase",
                          time: "22m ago",
                        },
                        {
                          id: "INC-4812",
                          title: "Cache stampede — redis/session",
                          sev: "P2",
                          sevClr: "bg-primary-yellow text-foreground",
                          status: "Resolved",
                          statusClr: "text-foreground font-bold uppercase",
                          time: "1h ago",
                        },
                      ].map((row, idx) => (
                        <motion.div
                          key={row.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + idx * 0.08 }}
                          className={`flex items-center gap-4 px-4 py-3 text-[12px] font-bold ${
                            row.highlight ? "bg-primary-yellow/20" : ""
                          }`}
                        >
                          <span className="font-mono text-foreground w-16 shrink-0 uppercase">
                            {row.id}
                          </span>
                          <span
                            className={`shrink-0 px-2 py-1 border-2 border-foreground text-[10px] font-black tracking-wider ${row.sevClr}`}
                          >
                            {row.sev}
                          </span>
                          <span className="flex-1 text-foreground truncate uppercase tracking-tight">
                            {row.title}
                          </span>
                          <span
                            className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] ${row.statusClr}`}
                          >
                            {row.highlight && (
                              <span className="w-2 h-2 bg-primary-red border border-foreground animate-pulse" />
                            )}
                            {row.status}
                          </span>
                          <span className="hidden lg:block text-[11px] text-foreground font-black w-16 text-right shrink-0 font-mono uppercase">
                            {row.time}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating PR toast */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="absolute -bottom-6 right-8 lg:right-16 hidden sm:flex items-center gap-4 px-5 py-4 bg-white border-4 border-foreground shadow-bauhaus-md"
          >
            <div className="w-10 h-10 border-[3px] border-foreground bg-primary-blue flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-black text-foreground uppercase tracking-wider">
                PR #4821 opened
              </div>
              <div className="text-[10px] font-bold text-foreground border-t-2 border-foreground mt-1 pt-1">
                fix: handle prisma timeout on user lookup
              </div>
            </div>
            <span className="w-2 h-2 bg-primary-yellow border border-foreground animate-pulse ml-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============ LOGO MARQUEE ============ */}
      <section className="relative z-10 border-b-4 border-foreground bg-white py-10 overflow-hidden">
        <p className="text-center text-[12px] font-black uppercase tracking-[0.3em] text-foreground mb-6">
          Trusted by engineering teams that ship at scale
        </p>
        <div className="relative" aria-hidden="true">
          <div className="flex gap-16 animate-[scroll_40s_linear_infinite] motion-reduce:animate-none whitespace-nowrap">
            {[...logos, ...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="text-2xl font-black tracking-[0.25em] text-foreground opacity-50 hover:opacity-100 transition-opacity"
              >
                {l}
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
        <style jsx>{`
          @keyframes scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </section>

      {/* ============ METRICS ============ */}
      <section className="relative z-10 py-24 border-b-4 border-foreground bg-primary-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[4px] bg-foreground border-4 border-foreground shadow-bauhaus-lg">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-background p-8 lg:p-10 hover:bg-primary-yellow transition-colors group flex flex-col justify-center items-center text-center"
              >
                <div className="text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
                  {m.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES (Bento) ============ */}
      <div
        id="features"
        className="py-32 bg-primary-yellow relative z-10 border-b-4 border-foreground"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-20"
          >
            <span className="inline-block text-[13px] font-bold uppercase tracking-[0.2em] text-foreground mb-4 border-2 border-foreground px-3 py-1 bg-background shadow-bauhaus-sm">
              Platform
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tight mb-5">
              Every capability a staff SRE
              <br />
              <span className="text-foreground">wished they had.</span>
            </h2>
            <p className="text-base text-foreground font-medium leading-relaxed max-w-xl">
              A focused surface of tools that compound. Nexus is opinionated
              where it matters, and invisible where it shouldn&apos;t.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.33, 1, 0.68, 1],
                }}
                className={`
                  bg-background border-4 border-foreground shadow-bauhaus-md flex flex-col group transition-transform hover:-translate-y-1 hover:shadow-bauhaus-lg
                  ${feature.size === "lg" ? "md:col-span-6 lg:col-span-8" : ""}
                  ${feature.size === "md" ? "md:col-span-3 lg:col-span-4" : ""}
                  ${feature.size === "sm" ? "md:col-span-3 lg:col-span-4" : ""}
                `}
              >
                <div className="relative flex flex-col h-full p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 border-4 border-foreground bg-primary-blue flex items-center justify-center shadow-bauhaus-sm group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                      <feature.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <span className="text-foreground font-black font-mono text-xs tracking-widest">
                      /{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-sm font-medium text-foreground leading-relaxed mb-6 max-w-md">
                    {feature.description}
                  </p>

                  <div className="mt-auto flex-1 border-4 border-foreground bg-background min-h-[180px] flex flex-col relative overflow-hidden">
                    <feature.component />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ WORKFLOW / ARCHITECTURE ============ */}
      <section id="architecture" className="relative z-10 py-32 border-b-4 border-foreground bg-primary-red overflow-hidden bauhaus-pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative bg-background border-4 border-foreground shadow-bauhaus-lg p-10 lg:p-16">
          <div className="text-center mb-20">
            <span className="inline-block text-[13px] font-bold uppercase tracking-[0.2em] text-foreground mb-4 border-2 border-foreground px-3 py-1 bg-primary-yellow shadow-bauhaus-sm">
              How it works
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tight">
              From alert to merged PR in under 5 minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-1 bg-foreground" />
            {workflow.map((w, i) => (
              <motion.div
                key={w.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative p-8 bg-background border-4 border-foreground shadow-bauhaus-md z-10"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative w-12 h-12 bg-primary-blue border-4 border-foreground shadow-bauhaus-sm flex items-center justify-center">
                    <w.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="font-mono font-bold text-xs tracking-widest text-foreground uppercase">
                    STEP {w.step}
                  </span>
                </div>
                <h3 className="text-xl font-black uppercase text-foreground mb-3">
                  {w.title}
                </h3>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {w.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LIVE OPS THEATER — unique widgets ============ */}
      <section className="relative z-10 py-32 border-b-4 border-foreground bg-primary-blue overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block text-[13px] font-bold uppercase tracking-[0.2em] text-foreground mb-4 border-2 border-foreground px-3 py-1 bg-background shadow-bauhaus-sm">
              Live Ops Theater
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tight">
              Watch Nexus think in real time.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SignalMeshWidget />
            <IncidentHeatwaveWidget />
            <PatchVelocityWidget />
          </div>
        </div>
      </section>

      {/* ============ SECURITY BAND ============ */}
      <section className="relative z-10 py-24 border-b-4 border-foreground bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-10">
          {[
            {
              icon: Lock,
              title: "SOC2 + ISO 27001",
              body: "Audited controls, encrypted at rest and in transit, scoped API keys.",
            },
            {
              icon: Gauge,
              title: "Self-hostable",
              body: "Deploy inside your VPC. Your telemetry never leaves your perimeter.",
            },
            {
              icon: Shield,
              title: "Human-in-the-loop",
              body: "Every autonomous action is reviewable, approvable, and revertible.",
            },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 p-6 border-4 border-foreground shadow-bauhaus-sm bg-primary-yellow hover:-translate-y-1 hover:shadow-bauhaus-md transition-all"
            >
              <div className="shrink-0 w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_#121212]">
                <s.icon className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h4 className="text-foreground font-black uppercase mb-1.5">{s.title}</h4>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section
        id="faq"
        className="py-32 relative z-10 border-b-4 border-foreground bg-background overflow-hidden bauhaus-pattern-dots"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 grid md:grid-cols-[1fr_2fr] gap-16 bg-primary-yellow border-4 border-foreground shadow-bauhaus-lg p-12">
          <div>
            <span className="inline-block text-[13px] font-bold uppercase tracking-[0.2em] text-foreground mb-4 border-2 border-foreground px-3 py-1 bg-background shadow-bauhaus-sm">
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl font-black uppercase text-foreground tracking-tight mb-4">
              Answers before you ask.
            </h2>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              Still curious? Our team is in your Slack the moment you start a
              trial.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-foreground border-b-4 last:border-b-0"
              >
                <AccordionTrigger className="text-left text-foreground font-black uppercase hover:bg-foreground hover:text-background transition-colors py-5 px-4 text-base data-[state=open]:bg-foreground data-[state=open]:text-background">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground font-medium leading-relaxed p-4 text-sm bg-background border-t-4 border-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 py-32 overflow-hidden bg-primary-blue border-b-4 border-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative bg-background border-4 border-foreground shadow-bauhaus-lg p-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl lg:text-6xl font-black uppercase text-foreground tracking-tight mb-6"
          >
            Stop babysitting{" "}
            <span className="text-primary-red">
              production.
            </span>
          </motion.h2>
          <p className="text-lg font-medium text-foreground mb-10 max-w-xl mx-auto">
            Give your on-call rotation back their weekends. 14 days free, no
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-black uppercase text-background bg-foreground border-4 border-foreground hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_0px_0px_#FFD100] transition-all"
            >
              Deploy Nexus
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-black uppercase text-foreground bg-background border-4 border-foreground hover:bg-primary-yellow hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_0px_0px_#121212] transition-all"
            >
              Talk to an engineer
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}

/* ================= UNIQUE WIDGETS ================= */

function WidgetShell({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background border-4 border-foreground shadow-bauhaus-md flex flex-col h-full group transition-transform hover:-translate-y-1 hover:shadow-bauhaus-lg">
      <div className="p-5 flex flex-col h-full min-h-[340px]">
        <div className="flex items-center justify-between mb-4 border-b-4 border-foreground pb-3">
          <span className="text-[12px] font-black uppercase text-foreground tracking-[0.1em] bg-primary-yellow px-2 py-1 border-2 border-foreground">
            {label}
          </span>
          <span className="text-[10px] text-background bg-foreground font-bold uppercase px-2 py-1 inline-flex items-center gap-1.5 border-2 border-foreground">
            <span className="w-2 h-2 bg-primary-red border-2 border-background animate-pulse" />
            streaming
          </span>
        </div>
        <h3 className="text-2xl font-black uppercase text-foreground tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm font-medium text-foreground mb-6">{subtitle}</p>
        <div className="flex-1 relative border-4 border-foreground bg-background flex flex-col">{children}</div>
      </div>
    </div>
  );
}

/* 1. Signal Mesh — animated SVG graph */
function SignalMeshWidget() {
  const nodes = [
    { id: "api", x: 50, y: 50, label: "API" },
    { id: "db", x: 180, y: 30, label: "DB" },
    { id: "cache", x: 180, y: 130, label: "CACHE" },
    { id: "worker", x: 300, y: 80, label: "WORKER" },
    { id: "queue", x: 300, y: 180, label: "QUEUE" },
    { id: "core", x: 160, y: 220, label: "CORE" },
  ];
  const edges: [string, string][] = [
    ["api", "db"],
    ["api", "cache"],
    ["db", "worker"],
    ["cache", "worker"],
    ["worker", "queue"],
    ["api", "core"],
    ["core", "queue"],
  ];
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <WidgetShell
      label="W01/MESH"
      title="Signal Mesh"
      subtitle="Live service topology — packet-level trace."
    >
      <div className="w-full h-full bg-background relative flex-1 flex flex-col">
        <svg viewBox="0 0 360 260" className="w-full h-full absolute inset-0">
          {/* Edges */}
          {edges.map(([a, b], i) => {
            const na = pos[a];
            const nb = pos[b];
            return (
              <g key={`${a}-${b}`}>
                <line
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke="#121212"
                  strokeWidth="3"
                />
                <motion.rect
                  width="10"
                  height="10"
                  fill="#FF3366"
                  stroke="#121212"
                  strokeWidth="2"
                  initial={{ x: na.x - 5, y: na.y - 5, opacity: 0 }}
                  animate={{
                    x: [na.x - 5, nb.x - 5],
                    y: [na.y - 5, nb.y - 5],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.35,
                    ease: "linear",
                  }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={n.id}>
              <rect x={n.x - 18} y={n.y - 18} width="36" height="36" fill="#FFD100" stroke="#121212" strokeWidth="3" />
              <motion.rect
                x={n.x - 6}
                y={n.y - 6}
                width="12"
                height="12"
                fill="#121212"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
              <text
                x={n.x}
                y={n.y + 32}
                textAnchor="middle"
                className="fill-foreground font-black text-[10px] uppercase"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] font-bold font-mono text-foreground border-t-4 border-foreground bg-primary-blue p-2">
          <span>6 nodes</span>
          <span className="text-background bg-foreground px-1">0 err</span>
          <span>42ms</span>
        </div>
      </div>
    </WidgetShell>
  );
}

/* 2. Incident Heatwave — grid of pulsing cells */
function IncidentHeatwaveWidget() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cols = 18;
  const rows = 7;
  const cells = Array.from({ length: cols * rows });

  const hotspots = [
    { idx: 3 * cols + 4, delay: 0 },
    { idx: 1 * cols + 11, delay: 0.6 },
    { idx: 5 * cols + 9, delay: 1.2 },
    { idx: 2 * cols + 15, delay: 1.8 },
    { idx: 4 * cols + 2, delay: 2.4 },
  ];
  const hotMap = new Map(hotspots.map((h) => [h.idx, h.delay]));

  return (
    <WidgetShell
      label="W02/HEAT"
      title="Incident Heatwave"
      subtitle="Severity by service × time — last 7 days."
    >
      <div className="p-3 bg-background flex flex-col h-full">
        <div
          className="grid gap-1 flex-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((_, i) => {
            const isHot = hotMap.has(i);
            const delay = hotMap.get(i) ?? 0;
            return (
              <motion.div
                key={i}
                className="border-2 border-foreground"
                style={{ background: "#F0F0F0" }}
                animate={
                  isHot
                    ? {
                        backgroundColor: [
                          "#FFD100",
                          "#FF3366",
                          "#FFD100",
                        ],
                      }
                    : mounted && Math.random() > 0.85
                    ? { backgroundColor: "#0055FF" }
                    : {}
                }
                transition={
                  isHot
                    ? { duration: 1.5, repeat: Infinity, delay }
                    : {}
                }
              />
            );
          })}
        </div>

        <div className="mt-4 space-y-2 border-t-4 border-foreground pt-3">
          {[
            { label: "auth-svc", val: 92, tone: "bg-primary-red" },
            { label: "orders-api", val: 64, tone: "bg-primary-yellow" },
            { label: "billing", val: 38, tone: "bg-primary-blue" },
          ].map((r, i) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase font-mono text-foreground w-16 shrink-0">
                {r.label}
              </span>
              <div className="flex-1 h-3 border-2 border-foreground bg-background overflow-hidden relative">
                <motion.div
                  className={`absolute left-0 top-0 bottom-0 border-r-2 border-foreground ${r.tone}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${r.val}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-black font-mono text-foreground w-8 text-right">
                {r.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

/* 3. Patch Velocity — radial + ticker */
function PatchVelocityWidget() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1800);
    return () => clearInterval(t);
  }, []);

  const feed = [
    { time: "00:12", msg: "PR #4821 · prisma timeout", ok: true },
    { time: "00:38", msg: "PR #4819 · OOM worker-3", ok: true },
    { time: "01:04", msg: "PR #4815 · null-check /users", ok: true },
    { time: "01:27", msg: "PR #4811 · retry stripe", ok: true },
    { time: "01:52", msg: "PR #4808 · redis stampede", ok: true },
  ];

  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const progress = 0.78;

  return (
    <WidgetShell
      label="W03/VELOCITY"
      title="Patch Velocity"
      subtitle="Autonomous PR throughput — 60 min."
    >
      <div className="bg-background flex flex-col h-full p-4">
        <div className="flex items-center gap-5">
          {/* Radial */}
          <div className="relative w-[100px] h-[100px] shrink-0 border-4 border-foreground rounded-full bg-primary-yellow shadow-bauhaus-sm flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full absolute inset-0">
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#0055FF"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                whileInView={{ strokeDashoffset: circ * (1 - progress) }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
            </svg>
            <div className="relative flex flex-col items-center justify-center bg-background border-4 border-foreground w-16 h-16 rounded-full z-10">
              <span className="text-xl font-black text-foreground tracking-tight">
                78%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="border-b-4 border-foreground pb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                PRs / hr
              </div>
              <div className="text-2xl font-black text-foreground">
                12.4
                <span className="text-xs font-bold bg-foreground text-background px-1 ml-2">↑ 2.1</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                avg ship
              </div>
              <div className="text-2xl font-black text-foreground">
                4m 12s
              </div>
            </div>
          </div>
        </div>

        {/* Live feed */}
        <div className="mt-auto pt-4 border-t-4 border-foreground space-y-1.5 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {feed
              .slice(tick % feed.length, (tick % feed.length) + 3)
              .concat(feed.slice(0, Math.max(0, ((tick % feed.length) + 3) - feed.length)))
              .slice(0, 3)
              .map((f, i) => (
                <motion.div
                  key={`${tick}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-[11px] font-bold font-mono uppercase bg-foreground text-background px-2 py-1"
                >
                  <span className="text-primary-yellow">{f.time}</span>
                  <span className="w-2 h-2 bg-primary-red border border-background" />
                  <span className="truncate">{f.msg}</span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}
