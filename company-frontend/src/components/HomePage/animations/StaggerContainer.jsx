import { motion, useReducedMotion } from 'framer-motion';

/**
 * StaggerContainer - Wraps child elements for staggered reveal animations
 * 
 * Usage:
 * <StaggerContainer>
 *   <StaggerItem>Card 1</StaggerItem>
 *   <StaggerItem>Card 2</StaggerItem>
 * </StaggerContainer>
 */

export const StaggerContainer = ({
    children,
    className = '',
    staggerDelay = 0.12,
    as = 'div'
}) => {
    const shouldReduceMotion = useReducedMotion();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
                delayChildren: 0.1
            }
        }
    };

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className={className}
        >
            {children}
        </MotionComponent>
    );
};

export const StaggerItem = ({
    children,
    className = '',
    as = 'div'
}) => {
    const shouldReduceMotion = useReducedMotion();

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 20
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldReduceMotion ? 0 : 0.5,
                ease: 'easeOut'
            }
        }
    };

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent variants={itemVariants} className={className}>
            {children}
        </MotionComponent>
    );
};

export default StaggerContainer;
