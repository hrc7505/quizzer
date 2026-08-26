"use client";

import * as React from "react";
import { Flame, Zap, Trophy, Sparkles } from "lucide-react";

import { cn } from "@/utils/cn";

export interface CelebrationBurst {
  id: number;
  x: number;
  y: number;
}

export interface StreakMilestone {
  streak: number;
  title: string;
  message: string;
  icon: "fire" | "zap" | "trophy";
}

interface TelegramQuizCelebrationProps {
  burst: CelebrationBurst | null;
  milestone: StreakMilestone | null;
  onClearMilestone: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  vRotation: number;
  type: "confetti" | "spark" | "star";
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

const CELEBRATION_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#ff4757", // Bright red
  "#f97316", // Orange
];

export function TelegramQuizCelebration({
  burst,
  milestone,
  onClearMilestone,
}: TelegramQuizCelebrationProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const balloonsRef = React.useRef<Balloon[]>([]);
  const animationFrameRef = React.useRef<number | null>(null);

  // Auto-dismiss streak milestone toast after 2.6s
  React.useEffect(() => {
    if (!milestone) return;
    const timer = setTimeout(() => {
      onClearMilestone();
    }, 2600);
    return () => clearTimeout(timer);
  }, [milestone, onClearMilestone]);

  // Handle firecracker / confetti burst spawn
  React.useEffect(() => {
    if (!burst) return;

    const { x, y } = burst;
    const count = 45; // 45 particles per burst
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 6 + 3;
      const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      const typeRand = Math.random();
      const type: Particle["type"] = typeRand > 0.6 ? "confetti" : typeRand > 0.3 ? "spark" : "star";

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2, // Slight upward bias
        color,
        size: type === "confetti" ? Math.random() * 6 + 4 : Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.015,
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 12,
        type,
      });
    }

    particlesRef.current.push(...newParticles);
  }, [burst]);

  // Spawn floating balloons when streak milestone is active
  React.useEffect(() => {
    if (!milestone) return;

    const newBalloons: Balloon[] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      newBalloons.push({
        id: Math.random(),
        x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800),
        y: typeof window !== "undefined" ? window.innerHeight + Math.random() * 120 : 850,
        size: Math.random() * 18 + 20, // Balloon radius 20-38px
        speed: Math.random() * 2.2 + 2.4,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        wobbleAmp: Math.random() * 25 + 15,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        alpha: 0.95,
      });
    }
    balloonsRef.current.push(...newBalloons);
  }, [milestone]);

  // Particle & Balloon Animation Loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render Firecracker Particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14; // Gravity
        p.vx *= 0.98; // Air resistance
        p.alpha -= p.decay;
        p.rotation += p.vRotation;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.type === "confetti") {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.type === "star") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
            ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Spark glow circle
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 2. Render Milestone Floating Balloons
      balloonsRef.current = balloonsRef.current.filter((b) => b.y > -120);
      for (const b of balloonsRef.current) {
        b.y -= b.speed;
        const currentX = b.x + Math.sin(time * b.wobbleSpeed) * b.wobbleAmp;
        const tiltAngle = Math.sin(time * b.wobbleSpeed) * 0.12;

        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(currentX, b.y);
        ctx.rotate(tiltAngle);

        const radiusX = b.size * 0.85;
        const radiusY = b.size * 1.1;

        // A. Balloon Waving String
        ctx.beginPath();
        ctx.moveTo(0, radiusY);
        const wave1 = Math.sin(time * 2) * 6;
        const wave2 = Math.cos(time * 2) * 8;
        ctx.bezierCurveTo(wave1, radiusY + 12, wave2, radiusY + 24, 0, radiusY + 36);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(160, 160, 160, 0.6)";
        ctx.stroke();

        // B. Balloon Knot
        ctx.beginPath();
        ctx.moveTo(-b.size * 0.15, radiusY + b.size * 0.15);
        ctx.lineTo(b.size * 0.15, radiusY + b.size * 0.15);
        ctx.lineTo(0, radiusY - 1);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        // C. Balloon Body (Egg/Teardrop shape via ellipse + curve)
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        
        // 3D Spherical Radial Gradient
        const grad = ctx.createRadialGradient(
          -radiusX * 0.3,
          -radiusY * 0.35,
          radiusX * 0.1,
          0,
          0,
          radiusY
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.2, b.color);
        grad.addColorStop(1, b.color);
        ctx.fillStyle = grad;
        ctx.fill();

        // D. Specular Glossy Highlight
        ctx.beginPath();
        ctx.ellipse(-radiusX * 0.35, -radiusY * 0.35, radiusX * 0.25, radiusY * 0.4, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fill();

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Keep canvas sized to viewport
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Fullscreen particle canvas overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 h-full w-full"
      />

      {/* Celebratory Streak Toast Message (2.5s) */}
      {milestone && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-card/95 backdrop-blur-md border border-primary/30 shadow-2xl animate-scale-in select-none">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              milestone.icon === "fire" && "bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-bounce",
              milestone.icon === "zap" && "bg-blue-500/15 text-blue-500 border border-blue-500/30 animate-pulse",
              milestone.icon === "trophy" && "bg-purple-500/15 text-purple-500 border border-purple-500/30 animate-bounce"
            )}
          >
            {milestone.icon === "fire" && <Flame className="h-5 w-5" />}
            {milestone.icon === "zap" && <Zap className="h-5 w-5" />}
            {milestone.icon === "trophy" && <Trophy className="h-5 w-5" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-extrabold text-sm text-foreground">
              <span>{milestone.title}</span>
              <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {milestone.message}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
