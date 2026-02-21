'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function MantencionPage() {
  return (
    <main className="mantencion-container">
      <div className="mantencion-card">
        <div className="mantencion-lottie">
          <DotLottieReact
            src="https://lottie.host/afb25b87-bbbe-48ec-bba9-00ce68b5a406/3aNNgfTXj5.lottie"
            loop
            autoplay
          />
        </div>

        <h1 className="mantencion-title">
          Estamos mejorando para ti
        </h1>

        <p className="mantencion-subtitle">
          Nuestro sitio está en mantención mientras realizamos mejoras.
          <br />
          Volveremos pronto con una mejor experiencia.
        </p>

        <div className="mantencion-badge">
          <span className="mantencion-pulse" />
          Mantención en progreso
        </div>
      </div>

      <style jsx>{`
        .mantencion-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf8f5;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .mantencion-container::before {
          content: '';
          position: absolute;
          top: -40%;
          left: -40%;
          width: 180%;
          height: 180%;
          background: radial-gradient(circle at 25% 40%, rgba(251, 146, 60, 0.06) 0%, transparent 55%),
                      radial-gradient(circle at 75% 60%, rgba(234, 179, 112, 0.05) 0%, transparent 55%);
          animation: bgFloat 18s ease-in-out infinite;
        }

        @keyframes bgFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-1.5%, 0.8%); }
        }

        .mantencion-card {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 600px;
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 28px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.08),
                      0 4px 20px rgba(0, 0, 0, 0.03);
          animation: cardIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .mantencion-lottie {
          width: 420px;
          height: 420px;
          margin: 0 auto 1rem;
        }

        .mantencion-title {
          font-size: 1.85rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .mantencion-subtitle {
          font-size: 1.05rem;
          color: #64748b;
          margin: 0 0 2rem;
          line-height: 1.7;
        }

        .mantencion-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.3rem;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 999px;
          color: #c2410c;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .mantencion-pulse {
          width: 8px;
          height: 8px;
          background: #f97316;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }

        @media (max-width: 640px) {
          .mantencion-card {
            padding: 2rem 1.5rem 1.5rem;
            border-radius: 20px;
          }

          .mantencion-lottie {
            width: 280px;
            height: 280px;
          }

          .mantencion-title {
            font-size: 1.4rem;
          }

          .mantencion-subtitle {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </main>
  );
}
