import { motion, useReducedMotion } from 'framer-motion';

/**
 * AnimatedSection - Wraps content with a fade-in + slide-up animation on scroll
 * 
 * Uses industry-standard animation: opacity 0→1, y 30→0, 0.6s ease-out
 * Respects prefers-reduced-motion for accessibility
 */
const AnimatedSection = ({
    children,
    className = '',
    delay = 0,
    as = 'section'
}) => {
    const shouldReduceMotion = useReducedMotion();

    const variants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 30
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldReduceMotion ? 0 : 0.6,
                ease: 'easeOut',
                delay: shouldReduceMotion ? 0 : delay
            }
        }
    };

    const MotionComponent = motion[as] || motion.section;

    return (
        <MotionComponent
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={variants}
            className={className}
        >
            {children}
        </MotionComponent>
    );
};

export default AnimatedSection;
