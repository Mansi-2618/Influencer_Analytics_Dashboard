// DashboardStyles.js
// Usage: Import this file in Dashboard.js
// import DashboardStyles from '@/components/DashboardStyles';
// Then add <DashboardStyles /> anywhere in your Dashboard component

export default function DashboardStyles() {
  return (
    <style jsx global>{`
      /* ==================== CLOUD AMBASSADORS DASHBOARD STYLES ==================== */

      /* CSS Variables */
      :root {
        --ca-navy: #1a2a4a;
        --ca-orange: #ff8c00;
        --ca-orange-light: #ffa726;
        --ca-orange-dark: #e67700;
        
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.15);
        --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.2);
        --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.3);
        --shadow-orange: 0 8px 20px rgba(255, 140, 0, 0.3);
        
        --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
        --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
        --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* ==================== CUSTOM SCROLLBAR ==================== */
      
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 5px;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--ca-orange);
        border-radius: 5px;
        transition: background var(--transition-normal);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--ca-orange-light);
      }

      /* Table Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 4px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ff8c00;
        border-radius: 4px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #ffa726;
      }

      /* ==================== ANIMATIONS ==================== */

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(255, 140, 0, 0);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ==================== UTILITY CLASSES ==================== */

      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }

      .animate-slide-left {
        animation: slideInLeft 0.4s ease-out;
      }

      .animate-slide-right {
        animation: slideInRight 0.4s ease-out;
      }

      .float-animation {
        animation: float 3s ease-in-out infinite;
      }

      .pulse-glow {
        animation: pulseGlow 2s ease-in-out infinite;
      }

      /* ==================== COMPONENT STYLES ==================== */

      /* Glassmorphism Card */
      .glass-card {
        background: rgba(51, 65, 85, 0.5);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        box-shadow: var(--shadow-lg);
      }

      /* Brand Button */
      .btn-brand {
        background: linear-gradient(135deg, var(--ca-orange) 0%, var(--ca-orange-dark) 100%);
        color: white;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        transition: all var(--transition-normal);
        box-shadow: var(--shadow-md);
      }

      .btn-brand:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-orange);
      }

      .btn-brand:active {
        transform: translateY(0);
      }

      /* Metric Card Hover Effect */
      .metric-card {
        transition: all var(--transition-normal);
        position: relative;
        overflow: hidden;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 140, 0, 0.1),
          transparent
        );
        transition: left 0.5s;
      }

      .metric-card:hover::before {
        left: 100%;
      }

      .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }

      /* Chart Container */
      .chart-container {
        background: rgba(30, 41, 59, 0.5);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 1rem;
        padding: 1.5rem;
        transition: all var(--transition-normal);
      }

      .chart-container:hover {
        border-color: rgba(255, 140, 0, 0.3);
        box-shadow: 0 8px 20px rgba(255, 140, 0, 0.15);
      }

      /* Loading Skeleton */
      .skeleton {
        background: linear-gradient(
          90deg,
          rgba(51, 65, 85, 0.5) 25%,
          rgba(71, 85, 105, 0.5) 50%,
          rgba(51, 65, 85, 0.5) 75%
        );
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 0.5rem;
      }

      /* ==================== BADGES ==================== */

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badge-success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .badge-warning {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .badge-error {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .badge-info {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      /* ==================== TOOLTIPS ==================== */

      .tooltip {
        position: relative;
        display: inline-block;
      }

      .tooltip .tooltip-text {
        visibility: hidden;
        background-color: var(--ca-navy);
        color: white;
        text-align: center;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        position: absolute;
        z-index: 1000;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity var(--transition-normal);
        white-space: nowrap;
        font-size: 0.875rem;
        box-shadow: var(--shadow-lg);
      }

      .tooltip .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: var(--ca-navy) transparent transparent transparent;
      }

      .tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }

      /* ==================== NAVBAR ENHANCEMENTS ==================== */

      .navbar-blur {
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        background-color: rgba(26, 42, 74, 0.9);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }

      .logo-container {
        transition: transform var(--transition-normal);
      }

      .logo-container:hover {
        transform: scale(1.05);
      }

      /* Nav Tab Active Indicator */
      .nav-tab {
        position: relative;
        transition: all var(--transition-normal);
      }

      .nav-tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--ca-orange);
        border-radius: 3px 3px 0 0;
      }

      /* ==================== SIDEBAR ENHANCEMENTS ==================== */

      .sidebar-item {
        transition: all var(--transition-normal);
        position: relative;
        overflow: hidden;
      }

      .sidebar-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: var(--ca-orange);
        transition: height var(--transition-normal);
        border-radius: 0 3px 3px 0;
      }

      .sidebar-item.active::before,
      .sidebar-item:hover::before {
        height: 70%;
      }

      /* ==================== DATA VISUALIZATION ==================== */

      .metric-value {
        font-variant-numeric: tabular-nums;
        transition: all var(--transition-normal);
      }

      .metric-value.positive {
        color: #10b981;
      }

      .metric-value.negative {
        color: #ef4444;
      }

      .chart-enter {
        animation: fadeIn 0.6s ease-out;
      }

      /* ==================== GLOWING BORDER EFFECT ==================== */

      .glow-border {
        position: relative;
        border: 1px solid rgba(148, 163, 184, 0.2);
        transition: all var(--transition-normal);
      }

      .glow-border::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(
          135deg,
          var(--ca-orange),
          var(--ca-orange-light),
          var(--ca-orange)
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity var(--transition-normal);
      }

      .glow-border:hover::before {
        opacity: 1;
      }

      /* ==================== ACCESSIBILITY ==================== */

      *:focus-visible {
        outline: 2px solid var(--ca-orange);
        outline-offset: 2px;
        border-radius: 0.25rem;
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* ==================== RESPONSIVE UTILITIES ==================== */

      @media (max-width: 768px) {
        .mobile-menu-open {
          overflow: hidden;
        }
        
        .mobile-sidebar {
          transform: translateX(-100%);
          transition: transform var(--transition-normal);
        }
        
        .mobile-sidebar.open {
          transform: translateX(0);
        }
      }

      /* ==================== PRINT STYLES ==================== */

      @media print {
        .no-print {
          display: none !important;
        }
        
        .print-full-width {
          width: 100% !important;
          margin: 0 !important;
        }
      }

      /* ==================== END DASHBOARD STYLES ==================== */
    `}</style>
  );
}