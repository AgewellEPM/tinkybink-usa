'use client';

import React, { useEffect, useState } from 'react';

interface CelebrationEffectsProps {
  type: 'confetti' | 'fireworks' | 'stars' | 'rainbow';
  duration: number;
  message?: string;
  onComplete?: () => void;
}

export default function CelebrationEffects({ 
  type, 
  duration, 
  message,
  onComplete 
}: CelebrationEffectsProps) {
  const [particles, setParticles] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate particles based on type
    const newParticles = generateParticles(type);
    setParticles(newParticles);

    // Play sound effect
    playSound(type);

    // Hide after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration, onComplete]);

  const generateParticles = (effectType: string) => {
    const count = effectType === 'confetti' ? 150 : effectType === 'fireworks' ? 100 : 80;
    const newParticles = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: getRandomColor(effectType),
        size: Math.random() * 20 + 10,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1,
        rotation: Math.random() * 360
      });
    }

    return newParticles;
  };

  const getRandomColor = (effectType: string) => {
    const colors = {
      confetti: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'],
      fireworks: ['#ff0000', '#ffd700', '#ff69b4', '#00ff00', '#1e90ff', '#ff1493'],
      stars: ['#ffd700', '#ffff00', '#fffacd', '#f0e68c', '#fff8dc'],
      rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
    };

    const palette = colors[effectType as keyof typeof colors] || colors.confetti;
    return palette[Math.floor(Math.random() * palette.length)];
  };

  const playSound = (effectType: string) => {
    // In production, play actual sound effects
    console.log(`🔊 Playing ${effectType} sound effect`);
  };

  if (!isVisible) return null;

  return (
    <div className="celebration-container">
      {/* Particles */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`particle ${type}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `rotate(${particle.rotation}deg)`
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="celebration-message">
          <h2>{message}</h2>
        </div>
      )}

      <style jsx>{`
        .celebration-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
        }

        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .particle.confetti {
          animation: confetti-fall 3s ease-out forwards;
        }

        .particle.fireworks {
          animation: firework-explode 2s ease-out forwards;
        }

        .particle.stars {
          animation: star-twinkle 2s ease-in-out infinite;
        }

        .particle.rainbow {
          animation: rainbow-wave 3s ease-in-out forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes firework-explode {
          0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) translate(
              calc(var(--random-x, 0) * 200px - 100px),
              calc(var(--random-y, 0) * 200px - 100px)
            );
            opacity: 1;
          }
          100% {
            transform: scale(0.5) translate(
              calc(var(--random-x, 0) * 400px - 200px),
              calc(var(--random-y, 0) * 400px - 200px)
            );
            opacity: 0;
          }
        }

        @keyframes star-twinkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.5;
          }
        }

        @keyframes rainbow-wave {
          0% {
            transform: translateX(-100vw) translateY(0);
            opacity: 0;
          }
          50% {
            transform: translateX(0) translateY(-20px);
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(0);
            opacity: 0;
          }
        }

        .celebration-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          animation: message-pop 0.5s ease-out forwards;
        }

        .celebration-message h2 {
          font-size: 48px;
          font-weight: 700;
          color: white;
          text-shadow: 
            2px 2px 4px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(255, 255, 255, 0.5);
          margin: 0;
          background: linear-gradient(45deg, #ff0080, #ff8c00, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes message-pop {
          0% {
            transform: translate(-50%, -50%) scale(0);
          }
          80% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @media (max-width: 768px) {
          .celebration-message h2 {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}