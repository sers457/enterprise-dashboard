import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { LoginForm } from '@/components/Auth/LoginForm';

function ParticleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-primary-950 to-secondary-950" />
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10 animate-float"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animationDuration: Math.random() * 10 + 10 + 's',
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <ParticleBackground />
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/25">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Sign in to your enterprise dashboard</p>
          </div>

          <div className="glass-card-dark p-8">
            <LoginForm onSuccess={() => navigate('/dashboard')} onRegisterClick={() => navigate('/register')} />
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-900 via-secondary-900 to-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary-500/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg"
          >
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Enterprise Intelligence<br />
              <span className="gradient-text">At Your Fingertips</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Comprehensive analytics, AI-powered insights, and real-time monitoring for your business operations.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Real-time Analytics', desc: 'Track KPIs and metrics live' },
                { title: 'AI-Powered Insights', desc: 'Intelligent recommendations' },
                { title: 'Team Collaboration', desc: 'Work together seamlessly' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{feature.title}</p>
                    <p className="text-sm text-white/50">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
