'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  PiggyBankIcon,
  CoinsIcon,
  HandCoinsIcon,
  ArrowRightIcon,
  LockIcon,
  StarIcon,
  CheckCircle2Icon,
} from 'lucide-react';

export default function HomePage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-fountain-blue/20 text-fountain-dark overflow-x-hidden">
      <nav className="bg-white/80 backdrop-blur-md border-b border-fountain-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/712c64ce-2884-4e65-9cac-33dd260726c9.png" alt="Fountain Coop Logo" className="h-10 w-10 object-contain" />
            <span className="font-extrabold text-2xl text-fountain-dark tracking-tight">Fountain</span>
          </div>
          <Link href="/login" className="px-6 py-2.5 bg-fountain-dark text-white rounded-full text-sm font-bold hover:bg-fountain-blue transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-block text-center">Sign In</Link>
        </div>
      </nav>

      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-fountain-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-fountain-green/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl">
              <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-white border border-fountain-gray-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-fountain-green"></span>
                <span className="text-xs font-bold text-fountain-gray-600 uppercase tracking-wider">Trusted by 2,800+ members</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                Save together, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fountain-blue to-fountain-teal">grow together.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-fountain-gray-500 mb-10 leading-relaxed max-w-lg">
                Your cooperative society, now in your pocket. Track your savings, access quick loans, and build your financial future with the community you trust.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-fountain-blue text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-fountain-blue/30 hover:-translate-y-1 flex items-center justify-center group">
                  Get Started<ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-sm text-fountain-gray-400 font-medium px-4">Takes 2 minutes to join</p>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} className="relative lg:ml-auto">
              <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[380px]">
                <div className="relative rounded-[2.5rem] border-[8px] border-fountain-dark bg-white shadow-2xl overflow-hidden aspect-[9/19]">
                  <div className="absolute inset-0 bg-fountain-gray-50 flex flex-col">
                    <div className="bg-fountain-dark p-6 text-white pb-12 rounded-b-3xl">
                      <p className="text-white/70 text-xs mb-1">Total Balance</p>
                      <h3 className="text-3xl font-bold">₦450,000</h3>
                    </div>
                    <div className="px-4 -mt-6 flex-1 space-y-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-fountain-gray-100 flex items-center space-x-4">
                        <div className="w-10 h-10 bg-fountain-green/10 rounded-full flex items-center justify-center"><PiggyBankIcon className="w-5 h-5 text-fountain-green" /></div>
                        <div><p className="text-xs text-fountain-gray-500">Cooperative</p><p className="font-bold text-fountain-dark">₦300,000</p></div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-fountain-gray-100 flex items-center space-x-4">
                        <div className="w-10 h-10 bg-fountain-teal/10 rounded-full flex items-center justify-center"><CoinsIcon className="w-5 h-5 text-fountain-teal" /></div>
                        <div><p className="text-xs text-fountain-gray-500">Daily Thrift</p><p className="font-bold text-fountain-dark">₦150,000</p></div>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} className="absolute -right-12 top-20 bg-white p-4 rounded-2xl shadow-xl border border-fountain-gray-100 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-fountain-green/10 rounded-full flex items-center justify-center"><CheckCircle2Icon className="w-6 h-6 text-fountain-green" /></div>
                  <div><p className="text-xs text-fountain-gray-500 font-medium">Goal Reached!</p><p className="text-sm font-bold text-fountain-dark">₦500k Saved</p></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-fountain-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-fountain-gray-100">
            <div><p className="text-3xl font-extrabold text-fountain-dark mb-1">2,800+</p><p className="text-sm text-fountain-gray-500 font-medium">Active Members</p></div>
            <div><p className="text-3xl font-extrabold text-fountain-blue mb-1">₦184M+</p><p className="text-sm text-fountain-gray-500 font-medium">Savings Managed</p></div>
            <div><p className="text-3xl font-extrabold text-fountain-teal mb-1">100%</p><p className="text-sm text-fountain-gray-500 font-medium">Secure & Transparent</p></div>
            <div><p className="text-3xl font-extrabold text-fountain-green mb-1">24/7</p><p className="text-sm text-fountain-gray-500 font-medium">Access to Funds</p></div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-fountain-dark mb-4">Everything you need to build wealth, effortlessly.</h2>
            <p className="text-lg text-fountain-gray-500">We've digitized the traditional cooperative experience so you can save, borrow, and grow your money with complete peace of mind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <PiggyBankIcon className="w-7 h-7 text-fountain-green" />, bg: 'bg-fountain-green/10', title: 'Save at your own pace', desc: 'Automate your monthly cooperative contributions. Watch your money grow with competitive interest rates and full transparency.' },
              { icon: <CoinsIcon className="w-7 h-7 text-fountain-teal" />, bg: 'bg-fountain-teal/10', title: 'Daily Thrift (Ajo)', desc: 'Participate in daily thrift collections digitally. No more paper cards or waiting for the collector. Pay directly from your phone.' },
              { icon: <HandCoinsIcon className="w-7 h-7 text-fountain-blue" />, bg: 'bg-fountain-blue/10', title: 'Access loans instantly', desc: 'Need cash? Apply for cooperative loans directly from the app. Get approved faster with your savings history as collateral.' },
            ].map((card, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="bg-white rounded-3xl p-8 border border-fountain-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-6`}>{card.icon}</div>
                <h3 className="text-xl font-bold text-fountain-dark mb-3">{card.title}</h3>
                <p className="text-fountain-gray-500 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-fountain-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Don&apos;t just take our word for it</h2>
            <p className="text-lg text-fountain-gray-400">Hear from members who are building their future with us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { initials: 'OA', color: 'bg-fountain-teal', name: 'Oluwaseun Adebayo', role: 'Market Trader', quote: '"I used to worry about my thrift collector not showing up. Now I pay my daily ₦1,000 directly on the app and I can see my balance grow every day."' },
              { initials: 'CN', color: 'bg-fountain-blue', name: 'Chidi Nwachukwu', role: 'Civil Servant', quote: '"When I needed a loan for my children\'s school fees, I applied through the app and got approved in 24 hours. No paperwork, no stress."' },
              { initials: 'FI', color: 'bg-fountain-green', name: 'Fatima Ibrahim', role: 'Cooperative Secretary', quote: '"As a cooperative admin, this platform has saved me hours of reconciliation. The members love the app, and I love the automated reporting."' },
            ].map((t, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="flex text-fountain-amber mb-4">{[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 fill-current" />)}</div>
                <p className="text-lg text-white/90 mb-6 leading-relaxed">{t.quote}</p>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${t.color} rounded-full flex items-center justify-center font-bold text-lg`}>{t.initials}</div>
                  <div><p className="font-bold">{t.name}</p><p className="text-sm text-white/60">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-fountain-blue/10 rounded-full flex items-center justify-center mx-auto mb-6"><LockIcon className="w-8 h-8 text-fountain-blue" /></div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-fountain-dark mb-4">Your money is safe and secure</h2>
          <p className="text-lg text-fountain-gray-500 mb-8">We use bank-level security and encryption to ensure your data and funds are always protected. Built in compliance with NDPR and CBN guidelines.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center space-x-2 bg-fountain-gray-50 px-4 py-2 rounded-full border border-fountain-gray-200"><ShieldCheckIcon className="w-5 h-5 text-fountain-green" /><span className="text-sm font-bold text-fountain-dark">256-bit Encryption</span></div>
            <div className="flex items-center space-x-2 bg-fountain-gray-50 px-4 py-2 rounded-full border border-fountain-gray-200"><ShieldCheckIcon className="w-5 h-5 text-fountain-green" /><span className="text-sm font-bold text-fountain-dark">NDPR Compliant</span></div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-fountain-blue to-fountain-teal text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to take control of your finances?</h2>
          <p className="text-xl text-white/80 mb-10">Join thousands of Nigerians building wealth together through modern cooperative savings.</p>
          <Link href="/login" className="inline-block px-10 py-5 bg-white text-fountain-blue rounded-full font-bold text-xl hover:bg-fountain-gray-50 transition-all shadow-2xl hover:-translate-y-1">Create Free Account</Link>
        </div>
      </section>

      <footer className="bg-white border-t border-fountain-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <img src="/712c64ce-2884-4e65-9cac-33dd260726c9.png" alt="Fountain Coop Logo" className="h-8 w-8 object-contain grayscale opacity-60" />
            <span className="font-bold text-lg text-fountain-gray-400">Fountain Coop</span>
          </div>
          <div className="flex space-x-8 text-sm font-medium text-fountain-gray-500">
            <a href="#" className="hover:text-fountain-blue transition-colors">About Us</a>
            <a href="#" className="hover:text-fountain-blue transition-colors">Security</a>
            <a href="#" className="hover:text-fountain-blue transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-fountain-blue transition-colors">Privacy Policy</a>
          </div>
          <div className="mt-6 md:mt-0 text-sm text-fountain-gray-400">© 2026 Fountain Coop. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
