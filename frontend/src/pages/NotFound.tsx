import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/UI/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-950 p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <SearchX className="h-12 w-12 text-white" />
        </motion.div>
        <h1 className="text-6xl font-extrabold text-neutral-900 dark:text-white mb-2">404</h1>
        <p className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Page not found</p>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
