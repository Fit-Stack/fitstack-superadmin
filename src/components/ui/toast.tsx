// Re-export useToast from the global context
// This allows existing components to continue using the same import path
export { useToast, type Toast } from '@/contexts/ToastContext';
