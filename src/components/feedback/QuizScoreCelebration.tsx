"use client";

import * as React from "react";
import { AlertTriangle, Flame, Target, Sparkles, Trophy, Crown } from "lucide-react";

import { cn } from "@/utils/cn";
import { soundEffects } from "@/lib/services/sound-effects.service";

import type {
  ScoreTierMeta,
  QuizScoreCelebrationProps,
} from "@/components/feedback/interfaces/QuizScoreCelebration.interface";

/**
 * Returns metadata and tier configuration for a score percentage.
 */
export function getScoreTierMeta(score: number): ScoreTierMeta {
  const rounded = Math.round(score);

  if (rounded < 40) {
    return {
      tier: "danger",
      title: "Needs Review — Build Foundation",
      subtitle: "Review the concepts and detailed explanations below to improve your score.",
      badgeVariant: "danger",
      gradientClass: "from-red-600/25 via-rose-500/10 to-transparent",
      glowClass: "shadow-red-500/25 border-red-500/50 text-red-500",
      iconName: "skull",
    };
  }

  if (rounded < 60) {
    return {
      tier: "improvement",
      title: "Keep Practicing — Room for Improvement",
      subtitle: "You're making progress! Review the incorrect answers below to master these concepts.",
      badgeVariant: "warning",
      gradientClass: "from-amber-500/25 via-orange-500/10 to-transparent",
      glowClass: "shadow-amber-500/25 border-amber-500/50 text-amber-500",
      iconName: "flame",
    };
  }

  if (rounded < 80) {
    return {
      tier: "moderate",
      title: "Good Effort — Passing Score!",
      subtitle: "Good work! You have a solid grasp of the core concepts in this quiz.",
      badgeVariant: "default",
      gradientClass: "from-blue-500/25 via-cyan-500/10 to-transparent",
      glowClass: "shadow-blue-500/25 border-blue-500/50 text-blue-500",
      iconName: "target",
    };
  }

  if (rounded < 95) {
    return {
      tier: "appreciation",
      title: "Great Score — Well Done!",
      subtitle: "Excellent result! You've mastered most topics in this quiz.",
      badgeVariant: "success",
      gradientClass: "from-emerald-500/25 via-teal-500/10 to-transparent",
      glowClass: "shadow-emerald-500/25 border-emerald-500/50 text-emerald-500",
      iconName: "star",
    };
  }

  if (rounded < 100) {
    return {
      tier: "outstanding",
      title: "Superb Mastery! Near Perfect!",
      subtitle: "Outstanding performance! You demonstrated top-tier academic precision.",
      badgeVariant: "success",
      gradientClass: "from-purple-500/30 via-amber-500/20 to-transparent",
      glowClass: "shadow-purple-500/30 border-purple-500/50 text-purple-400",
      iconName: "trophy",
    };
  }

  // 100% Perfect
  return {
    tier: "perfect",
    title: "👑 PERFECT 100% SCORE!",
    subtitle: "Flawless victory! You answered every single question with 100% absolute accuracy!",
    badgeVariant: "default",
    gradientClass: "from-amber-400/35 via-yellow-500/25 to-purple-600/20",
    glowClass: "shadow-amber-400/50 border-amber-400/70 text-amber-400",
    iconName: "crown",
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  decay: number;
  rotation?: number;
  vRotation?: number;
  type: "rain" | "ember" | "flameOrb" | "spark" | "confetti" | "star" | "fireworkSpark";
}

interface Balloon {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  color: string;
  alpha: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  color: string;
}

const BALLOON_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ff4757",
  "#f97316",
];

const MODERATE_BALLOONS = ["#3b82f6", "#06b6d4", "#10b981", "#6366f1"];
const IMPROVEMENT_COLORS = ["#f59e0b", "#f97316", "#fbbf24", "#eab308", "#ff793f"];
const FIREWORK_COLORS = ["#fbbf24", "#ec4899", "#3b82f6", "#10b981", "#a855f7", "#ffffff", "#f97316"];

export function QuizScoreCelebration({
  scorePercentage,
  className,
  autoPlaySound = true,
}: QuizScoreCelebrationProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const balloonsRef = React.useRef<Balloon[]>([]);
  const rocketsRef = React.useRef<Rocket[]>([]);
  const animationFrameRef = React.useRef<number | null>(null);

  const meta = React.useMemo(() => getScoreTierMeta(scorePercentage), [scorePercentage]);

  // Audio trigger on mount
  React.useEffect(() => {
    if (autoPlaySound) {
      const timer = setTimeout(() => {
        soundEffects.playScoreResultSound(scorePercentage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scorePercentage, autoPlaySound]);

  // Canvas Animation & Continuous Spawning Engine
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    // Clear previous refs
    particlesRef.current = [];
    balloonsRef.current = [];
    rocketsRef.current = [];

    let frame = 0;
    let lightningFlash = 0;
    const tier = meta.tier;

    // Helper: Spawn Balloon
    const spawnBalloon = (palette: string[], startY?: number) => {
      balloonsRef.current.push({
        id: Math.random(),
        x: Math.random() * width,
        y: startY !== undefined ? startY : height + Math.random() * 80 + 30,
        size: Math.random() * 16 + 22,
        speed: Math.random() * 1.8 + 2.0,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        wobbleAmp: Math.random() * 25 + 15,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 0.92,
      });
    };

    // Helper: Spawn Firework explosion
    const triggerFireworkBurst = (cx: number, cy: number, colorArr: string[]) => {
      const count = 40;
      for (let p = 0; p < count; p++) {
        const angle = (Math.PI * 2 * p) / count + (Math.random() - 0.5) * 0.2;
        const spd = Math.random() * 5 + 3;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 4 + 2,
          color: colorArr[Math.floor(Math.random() * colorArr.length)],
          alpha: 1,
          maxAlpha: 1,
          decay: Math.random() * 0.015 + 0.012,
          type: "fireworkSpark",
        });
      }
    };

    // Initial batch seed for balloons
    if (tier === "moderate") {
      for (let i = 0; i < 12; i++) spawnBalloon(MODERATE_BALLOONS, Math.random() * height);
    } else if (tier === "appreciation" || tier === "outstanding" || tier === "perfect") {
      const initCount = tier === "perfect" ? 28 : tier === "outstanding" ? 20 : 16;
      for (let i = 0; i < initCount; i++) spawnBalloon(BALLOON_PALETTE, Math.random() * height);
    }

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // CONTINUOUS SPAWNERS PER TIER
      // ==========================================

      // TIER 1: DANGER (< 25%) - Heavy rain, rising red embers, lightning flashes
      if (tier === "danger") {
        // Red rain drops
        if (particlesRef.current.filter((p) => p.type === "rain").length < 45) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: -10,
            vx: -1.5,
            vy: Math.random() * 12 + 10,
            size: Math.random() * 16 + 10, // Length of rain line
            color: Math.random() > 0.3 ? "rgba(239, 68, 68, 0.4)" : "rgba(248, 113, 113, 0.3)",
            alpha: 0.7,
            maxAlpha: 0.7,
            decay: 0.01,
            type: "rain",
          });
        }
        // Rising red/orange burning embers
        if (particlesRef.current.filter((p) => p.type === "ember").length < 35) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: height + 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(Math.random() * 2.5 + 1.2),
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? "#ef4444" : "#f97316",
            alpha: 1,
            maxAlpha: 1,
            decay: Math.random() * 0.006 + 0.004,
            type: "ember",
          });
        }
        // Periodic red lightning flash
        if (frame % 180 === 0 && Math.random() > 0.4) {
          lightningFlash = 0.18;
        }
        if (lightningFlash > 0.01) {
          ctx.fillStyle = `rgba(239, 68, 68, ${lightningFlash})`;
          ctx.fillRect(0, 0, width, height);
          lightningFlash *= 0.88;
        }
      }

      // TIER 2: IMPROVEMENT (25% - 49%) - Continuous swirling flame orbs & upward energy sparks
      if (tier === "improvement") {
        if (particlesRef.current.length < 50) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: height + Math.random() * 20,
            vx: (Math.random() - 0.5) * 1.8,
            vy: -(Math.random() * 2.8 + 1.8),
            size: Math.random() * 6 + 3,
            color: IMPROVEMENT_COLORS[Math.floor(Math.random() * IMPROVEMENT_COLORS.length)],
            alpha: 1,
            maxAlpha: 1,
            decay: Math.random() * 0.005 + 0.004,
            rotation: Math.random() * 360,
            vRotation: (Math.random() - 0.5) * 6,
            type: Math.random() > 0.4 ? "flameOrb" : "spark",
          });
        }
      }

      // TIER 3: MODERATE (50% - 74%) - Blue & Cyan balloons + gentle stars
      if (tier === "moderate") {
        if (balloonsRef.current.length < 14 && frame % 45 === 0) {
          spawnBalloon(MODERATE_BALLOONS);
        }
        if (particlesRef.current.length < 30) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -(Math.random() * 0.8 + 0.3),
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? "#38bdf8" : "#34d399",
            alpha: Math.random() * 0.8 + 0.2,
            maxAlpha: 1,
            decay: 0.004,
            type: "star",
          });
        }
      }

      // TIER 4: APPRECIATION (75% - 89%) - Rainbow balloons + falling confetti
      if (tier === "appreciation") {
        if (balloonsRef.current.length < 18 && frame % 35 === 0) {
          spawnBalloon(BALLOON_PALETTE);
        }
        if (particlesRef.current.length < 45) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: -10,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2.5 + 1.5,
            size: Math.random() * 7 + 4,
            color: BALLOON_PALETTE[Math.floor(Math.random() * BALLOON_PALETTE.length)],
            alpha: 1,
            maxAlpha: 1,
            decay: 0.006,
            rotation: Math.random() * 360,
            vRotation: (Math.random() - 0.5) * 10,
            type: "confetti",
          });
        }
      }

      // TIER 5: OUTSTANDING (90% - 99%) - Rainbow balloons + launching fireworks rockets
      if (tier === "outstanding") {
        if (balloonsRef.current.length < 22 && frame % 30 === 0) {
          spawnBalloon(BALLOON_PALETTE);
        }
        // Launch fireworks rocket every 60 frames (~1s)
        if (frame % 55 === 0 && rocketsRef.current.length < 3) {
          rocketsRef.current.push({
            x: width * (0.15 + Math.random() * 0.7),
            y: height,
            targetY: height * (0.15 + Math.random() * 0.35),
            speed: Math.random() * 4 + 8,
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
          });
        }
      }

      // TIER 6: PERFECT 100% - Legendary grand fireworks barrage + huge balloon storm + star blizzard
      if (tier === "perfect") {
        if (balloonsRef.current.length < 30 && frame % 25 === 0) {
          spawnBalloon(BALLOON_PALETTE);
        }
        // Double rocket launcher
        if (frame % 40 === 0 && rocketsRef.current.length < 5) {
          rocketsRef.current.push({
            x: width * (0.1 + Math.random() * 0.8),
            y: height,
            targetY: height * (0.12 + Math.random() * 0.35),
            speed: Math.random() * 4 + 9,
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
          });
        }
        // Golden stars
        if (particlesRef.current.filter((p) => p.type === "star").length < 35) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 6 + 3,
            color: Math.random() > 0.4 ? "#fbbf24" : "#ffffff",
            alpha: 1,
            maxAlpha: 1,
            decay: 0.008,
            rotation: Math.random() * 360,
            vRotation: (Math.random() - 0.5) * 10,
            type: "star",
          });
        }
      }

      // ==========================================
      // RENDER ROCKETS
      // ==========================================
      for (let r = rocketsRef.current.length - 1; r >= 0; r--) {
        const rock = rocketsRef.current[r];
        rock.y -= rock.speed;

        // Draw rocket spark trail
        ctx.save();
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = rock.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(rock.x, rock.y);
        ctx.lineTo(rock.x + (Math.random() - 0.5) * 4, rock.y + 16);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        if (rock.y <= rock.targetY) {
          triggerFireworkBurst(rock.x, rock.targetY, FIREWORK_COLORS);
          rocketsRef.current.splice(r, 1);
        }
      }

      // ==========================================
      // RENDER PARTICLES
      // ==========================================
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.type === "fireworkSpark") {
          p.vy += 0.08; // Gravity
          p.vx *= 0.97;
        } else if (p.type === "flameOrb") {
          p.x += Math.sin(frame * 0.05 + p.y * 0.02) * 1.2;
        }

        if (p.alpha <= 0.01 || p.y < -30 || p.y > height + 30) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

        if (p.type === "rain") {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.size);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (p.type === "confetti") {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined && p.vRotation !== undefined) {
            p.rotation += p.vRotation;
            ctx.rotate((p.rotation * Math.PI) / 180);
          }
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.type === "star") {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined && p.vRotation !== undefined) {
            p.rotation += p.vRotation;
            ctx.rotate((p.rotation * Math.PI) / 180);
          }
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.type === "flameOrb") {
          // 3D glowing flame plasma orb with radial halo
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, p.color);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ember or Spark
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ==========================================
      // RENDER FLOATING BALLOONS
      // ==========================================
      for (let bIdx = balloonsRef.current.length - 1; bIdx >= 0; bIdx--) {
        const b = balloonsRef.current[bIdx];
        b.y -= b.speed;

        if (b.y < -150) {
          balloonsRef.current.splice(bIdx, 1);
          continue;
        }

        const currentX = b.x + Math.sin(frame * b.wobbleSpeed) * b.wobbleAmp;
        const tiltAngle = Math.sin(frame * b.wobbleSpeed) * 0.12;

        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(currentX, b.y);
        ctx.rotate(tiltAngle);

        const radiusX = b.size * 0.85;
        const radiusY = b.size * 1.1;

        // String
        ctx.beginPath();
        ctx.moveTo(0, radiusY);
        const wave1 = Math.sin(frame * 0.08) * 6;
        const wave2 = Math.cos(frame * 0.08) * 8;
        ctx.bezierCurveTo(wave1, radiusY + 12, wave2, radiusY + 24, 0, radiusY + 36);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(180, 180, 180, 0.6)";
        ctx.stroke();

        // Knot
        ctx.beginPath();
        ctx.moveTo(-b.size * 0.15, radiusY + b.size * 0.15);
        ctx.lineTo(b.size * 0.15, radiusY + b.size * 0.15);
        ctx.lineTo(0, radiusY - 1);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        // Balloon Body
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          -radiusX * 0.3,
          -radiusY * 0.35,
          radiusX * 0.1,
          0,
          0,
          radiusY
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.25, b.color);
        grad.addColorStop(1, b.color);
        ctx.fillStyle = grad;
        ctx.fill();

        // Specular Glossy Highlight
        ctx.beginPath();
        ctx.ellipse(-radiusX * 0.35, -radiusY * 0.35, radiusX * 0.25, radiusY * 0.4, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fill();

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [meta.tier]);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border bg-card p-5 sm:p-6 shadow-sm select-none", meta.glowClass, className)}>
      {/* Fullscreen particle & celebration canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 h-full w-full"
      />

      {/* Decorative gradient overlay */}
      <div className={cn("absolute inset-0 bg-linear-to-r pointer-events-none opacity-60", meta.gradientClass)} />

      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        {/* Animated Tier Icon Badge */}
        <div
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border animate-scale-in",
            meta.tier === "danger" && "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse",
            meta.tier === "improvement" && "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-bounce",
            meta.tier === "moderate" && "bg-blue-500/20 text-blue-500 border-blue-500/30 animate-pulse",
            meta.tier === "appreciation" && "bg-emerald-500/20 text-emerald-500 border-emerald-500/30 animate-bounce",
            meta.tier === "outstanding" && "bg-purple-500/20 text-purple-400 border-purple-500/40 animate-bounce",
            meta.tier === "perfect" && "bg-amber-400/25 text-amber-400 border-amber-400/50 shadow-amber-400/30 animate-bounce"
          )}
        >
          {meta.tier === "danger" && <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />}
          {meta.tier === "improvement" && <Flame className="h-6 w-6 sm:h-7 sm:w-7" />}
          {meta.tier === "moderate" && <Target className="h-6 w-6 sm:h-7 sm:w-7" />}
          {meta.tier === "appreciation" && <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />}
          {meta.tier === "outstanding" && <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />}
          {meta.tier === "perfect" && <Crown className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400 fill-amber-400 animate-pulse" />}
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1 text-left">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground m-0">
            {meta.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
            {meta.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuizScoreCelebration;
