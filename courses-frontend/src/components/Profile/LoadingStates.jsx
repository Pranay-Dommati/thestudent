import { motion } from 'framer-motion';
import { shimmer } from './animations';

export const LoadingCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm overflow-hidden">
    <div className="relative">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <motion.div
        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
        variants={shimmer}
        animate="animate"
      />
    </div>
  </div>
);

export const LoadingAvatar = () => (
  <div className="relative w-32 h-32">
    <div className="animate-pulse w-full h-full rounded-full bg-gray-200"></div>
    <motion.div
      className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
      variants={shimmer}
      animate="animate"
    />
  </div>
);

export const LoadingStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
    {[1, 2, 3].map((i) => (
      <div key={i} className="relative bg-white rounded-lg p-4 overflow-hidden">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <motion.div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
          variants={shimmer}
          animate="animate"
        />
      </div>
    ))}
  </div>
);

export const LoadingForm = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="relative overflow-hidden">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <motion.div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
          variants={shimmer}
          animate="animate"
        />
      </div>
    ))}
  </div>
);
