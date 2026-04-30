import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Footprints,
  Home,
  Leaf,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  User,
  Video,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { allWorkouts, workoutLibrary } from "./data/workoutLibrary";

const AUTH_STORAGE_KEY = "trainharder-auth";
const SESSION_STORAGE_KEY = "trainharder-active-session";
const HISTORY_STORAGE_KEY = "trainharder-session-history";
const VIDEO_STORAGE_KEY = "trainharder-exercise-videos";

const accentClasses = {
  cyan: {
    chip: "bg-cyan-300 text-slate-950",
    text: "text-cyan-300",
    border: "border-cyan-300/50",
    soft: "bg-cyan-300/12 text-cyan-100 border-cyan-300/24",
    button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    ring: "ring-cyan-300/40",
  },
  amber: {
    chip: "bg-amber-300 text-slate-950",
    text: "text-amber-300",
    border: "border-amber-300/50",
    soft: "bg-amber-300/12 text-amber-100 border-amber-300/24",
    button: "bg-amber-300 text-slate-950 hover:bg-amber-200",
    ring: "ring-amber-300/40",
  },
  rose: {
    chip: "bg-rose-300 text-slate-950",
    text: "text-rose-300",
    border: "border-rose-300/50",
    soft: "bg-rose-300/12 text-rose-100 border-rose-300/24",
    button: "bg-rose-300 text-slate-950 hover:bg-rose-200",
    ring: "ring-rose-300/40",
  },
  lime: {
    chip: "bg-lime-300 text-slate-950",
    text: "text-lime-300",
    border: "border-lime-300/50",
    soft: "bg-lime-300/12 text-lime-100 border-lime-300/24",
    button: "bg-lime-300 text-slate-950 hover:bg-lime-200",
    ring: "ring-lime-300/40",
  },
  sky: {
    chip: "bg-sky-300 text-slate-950",
    text: "text-sky-300",
    border: "border-sky-300/50",
    soft: "bg-sky-300/12 text-sky-100 border-sky-300/24",
    button: "bg-sky-300 text-slate-950 hover:bg-sky-200",
    ring: "ring-sky-300/40",
  },
  violet: {
    chip: "bg-violet-300 text-slate-950",
    text: "text-violet-300",
    border: "border-violet-300/50",
    soft: "bg-violet-300/12 text-violet-100 border-violet-300/24",
    button: "bg-violet-300 text-slate-950 hover:bg-violet-200",
    ring: "ring-violet-300/40",
  },
  emerald: {
    chip: "bg-emerald-300 text-slate-950",
    text: "text-emerald-300",
    border: "border-emerald-300/50",
    soft: "bg-emerald-300/12 text-emerald-100 border-emerald-300/24",
    button: "bg-emerald-300 text-slate-950 hover:bg-emerald-200",
    ring: "ring-emerald-300/40",
  },
  orange: {
    chip: "bg-orange-300 text-slate-950",
    text: "text-orange-300",
    border: "border-orange-300/50",
    soft: "bg-orange-300/12 text-orange-100 border-orange-300/24",
    button: "bg-orange-300 text-slate-950 hover:bg-orange-200",
    ring: "ring-orange-300/40",
  },
};

const familyIcons = {
  gym: Dumbbell,
  home: Home,
  calisthenics: Activity,
  animal: Footprints,
  taichi: Waves,
  stretching: TimerReset,
  yoga: Leaf,
  crossfit: Flame,
};

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const useStoredState = (key, fallback) => {
  const [value, setValue] = useState(() => readStoredValue(key, fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const extractUrlFromEmbed = (value) => {
  const trimmed = value.trim();
  const iframeSrc = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
  const anchorHref = trimmed.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1];

  return iframeSrc || anchorHref || trimmed;
};

const normalizeInstagramEmbed = (value) => {
  if (!value.trim()) {
    return { embedUrl: "", error: "" };
  }

  try {
    const url = new URL(extractUrlFromEmbed(value));
    const hostname = url.hostname.replace(/^www\./, "");
    const isInstagram = hostname === "instagram.com" || hostname === "instagr.am";

    if (!isInstagram) {
      return { embedUrl: "", error: "Use a public Instagram post or reel URL." };
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const contentType = parts[0] === "reels" ? "reel" : parts[0];
    const shortcode = parts[1];
    const allowedTypes = new Set(["p", "reel", "tv"]);

    if (!allowedTypes.has(contentType) || !shortcode) {
      return { embedUrl: "", error: "Instagram URL should look like /p/code or /reel/code." };
    }

    return {
      embedUrl: `https://www.instagram.com/${contentType}/${shortcode}/embed/`,
      error: "",
    };
  } catch {
    return { embedUrl: "", error: "Paste a valid Instagram URL or iframe embed code." };
  }
};

const getInstagramPermalink = (embedUrl) => embedUrl.replace(/\/embed\/?$/, "/");

function LoginView({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed");
      }

      onLogin(payload);
    } catch (loginError) {
      setError(loginError.message || "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-grid min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
            <ShieldCheck size={16} />
            <span>Private training console</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-none text-white sm:text-6xl lg:text-7xl">
            TrainHarder
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            A focused workout library and progress tracker for strength, mobility,
            calisthenics skills, mindful flow, and functional conditioning.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["8", "training styles"],
              ["96", "exercise slots"],
              ["100%", "mobile ready"],
            ].map(([value, label]) => (
              <div key={label} className="panel rounded-lg p-4">
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel relative overflow-hidden rounded-lg p-5 shadow-edge sm:p-7">
          <div className="scan-line absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/5" />
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h2 className="mt-1 text-2xl font-black text-white">Sign in</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-950">
              <LockKeyhole size={22} />
            </div>
          </div>

          <form className="space-y-4" onSubmit={submitLogin}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">Username</span>
              <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 px-3 py-3 text-white focus-within:border-cyan-300/70">
                <User size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Email address"
                  type="email"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">Password</span>
              <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 px-3 py-3 text-white focus-within:border-cyan-300/70">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="focus-ring rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error ? (
              <p className="animate-fade-up rounded-md border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <button
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Checking access" : "Enter dashboard"}
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="light-panel rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-black leading-none text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FamilyCard({ family, isActive, onSelect }) {
  const Icon = familyIcons[family.id] || Activity;
  const accent = accentClasses[family.accent];

  return (
    <button
      className={`group media-card focus-ring relative min-h-[232px] overflow-hidden rounded-lg border p-4 text-left shadow-lift transition duration-300 hover:-translate-y-1 ${
        isActive ? `${accent.border} ring-2 ${accent.ring}` : "border-white/12"
      }`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 16, 0.22), rgba(4, 8, 16, 0.90)), url(${family.hero})`,
      }}
      onClick={onSelect}
    >
      <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent.chip}`}>
            <Icon size={21} />
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-black ${accent.chip}`}>
            {family.stats}
          </span>
        </div>

        <div>
          <h3 className="text-2xl font-black text-white">{family.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">{family.summary}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-black text-white">
            Open library
            <ChevronRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function CategoryTabs({ family, activeCategoryId, onChange }) {
  return (
    <div className="scrollbar-soft flex gap-2 overflow-x-auto pb-2">
      {family.categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        const accent = accentClasses[family.accent];

        return (
          <button
            key={category.id}
            className={`focus-ring min-w-[190px] rounded-lg border px-4 py-3 text-left transition ${
              isActive
                ? `${accent.soft} ${accent.border}`
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
            onClick={() => onChange(category.id)}
          >
            <span className="block text-sm font-black">{category.muscle}</span>
            <span className={`mt-1 block text-xs ${isActive ? "text-white/70" : "text-slate-500"}`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WorkoutCard({ workout, family, onAdd, onOpen, isQueued }) {
  const accent = accentClasses[family.accent];
  const hasVideo = Boolean(workout.videoUrl);

  return (
    <article className="light-panel flex h-full flex-col rounded-lg p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-black ${accent.text}`}>{workout.target}</p>
          <h4 className="mt-1 text-xl font-black text-slate-950">{workout.name}</h4>
        </div>
        <button
          aria-label={`Preview ${workout.name}`}
          className="focus-ring rounded-md bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-950 hover:text-white"
          onClick={() => onOpen(workout)}
        >
          <Play size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-slate-100 p-3">
          <p className="text-slate-500">Level</p>
          <p className="font-black text-slate-950">{workout.level}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-3">
          <p className="text-slate-500">Dose</p>
          <p className="font-black text-slate-950">{workout.prescription}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{workout.tempo}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
          {workout.equipment}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${
            hasVideo
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600"
          }`}
        >
          <Video size={13} />
          {hasVideo ? "Instagram ready" : "Video slot"}
        </span>
      </div>

      <div className="mt-auto pt-4">
        <button
          className={`focus-ring flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-black transition ${
            isQueued
              ? "bg-slate-200 text-slate-500"
              : `${accent.button} shadow-[0_8px_22px_rgba(15,23,42,0.14)]`
          }`}
          disabled={isQueued}
          onClick={() => onAdd(workout)}
        >
          {isQueued ? <CheckCircle2 size={17} /> : <Plus size={17} />}
          {isQueued ? "In session" : "Add to session"}
        </button>
      </div>
    </article>
  );
}

function SessionPanel({ sessionItems, onToggle, onRemove, onFinish }) {
  const completedCount = sessionItems.filter((item) => item.completed).length;
  const completion = sessionItems.length
    ? Math.round((completedCount / sessionItems.length) * 100)
    : 0;

  return (
    <aside className="panel sticky top-4 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Today</p>
          <h3 className="text-xl font-black text-white">Session</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950">
          <ListChecks size={21} />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="font-black text-white">{completion}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-md bg-white/10">
          <div
            className="h-full rounded-md bg-cyan-300 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="scrollbar-soft mt-5 max-h-[380px] space-y-3 overflow-auto pr-1">
        {sessionItems.length ? (
          sessionItems.map((item) => (
            <div key={item.sessionId} className="rounded-lg border border-white/10 bg-white/6 p-3">
              <div className="flex items-start gap-3">
                <button
                  aria-label={`Mark ${item.name} complete`}
                  className={`focus-ring mt-1 rounded-md p-1 transition ${
                    item.completed ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-300"
                  }`}
                  onClick={() => onToggle(item.sessionId)}
                >
                  <CheckCircle2 size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.familyName} | {item.prescription}
                  </p>
                </div>
                <button
                  aria-label={`Remove ${item.name}`}
                  className="focus-ring rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  onClick={() => onRemove(item.sessionId)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-400">
            Pick exercises from the library to build today&apos;s work.
          </div>
        )}
      </div>

      <button
        className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 font-black text-slate-950 transition hover:bg-cyan-100 disabled:opacity-50"
        disabled={!sessionItems.length}
        onClick={onFinish}
      >
        <BadgeCheck size={18} />
        Finish session
      </button>
    </aside>
  );
}

function WorkoutDetail({ workout, family, onClose, onAdd, isQueued, onSaveVideo, onRemoveVideo }) {
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState("");

  useEffect(() => {
    setVideoInput(workout?.videoUrl || "");
    setVideoError("");
  }, [workout?.id, workout?.videoUrl]);

  if (!workout) {
    return null;
  }

  const accent = accentClasses[family.accent];
  const hasVideo = Boolean(workout.videoUrl);

  const saveVideo = () => {
    const result = normalizeInstagramEmbed(videoInput);

    if (result.error) {
      setVideoError(result.error);
      return;
    }

    setVideoError("");
    onSaveVideo(workout.id, result.embedUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="animate-slide-panel max-h-[92vh] w-full max-w-4xl overflow-auto rounded-lg bg-white text-slate-950 shadow-edge">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="video-frame relative min-h-[260px] p-5 text-white lg:min-h-full">
            <button
              aria-label="Close detail"
              className="focus-ring absolute right-4 top-4 rounded-md bg-white/10 p-2 text-white transition hover:bg-white hover:text-slate-950"
              onClick={onClose}
            >
              <X size={18} />
            </button>
            {hasVideo ? (
              <div className="flex h-full min-h-[420px] flex-col justify-center gap-3">
                <iframe
                  title={`${workout.name} Instagram video`}
                  className="h-[620px] max-h-[72vh] w-full rounded-lg border-0 bg-white shadow-edge"
                  src={workout.videoUrl}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <a
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
                  href={getInstagramPermalink(workout.videoUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on Instagram
                  <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <div className="flex h-full min-h-[250px] flex-col justify-end">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-white text-slate-950">
                  <Video size={28} />
                </div>
                <p
                  className={`mb-2 inline-flex w-fit rounded-md px-2 py-1 text-xs font-black ${accent.chip}`}
                >
                  Instagram slot
                </p>
                <h3 className="text-3xl font-black">{workout.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {workout.familyName} | {workout.categoryName}
                </p>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              {[workout.level, workout.target, workout.equipment].map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Prescription</p>
                <p className="mt-1 font-black">{workout.prescription}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Tempo</p>
                <p className="mt-1 font-black">{workout.tempo}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-black">Coaching cues</h4>
              <div className="mt-3 space-y-2">
                {workout.cues.map((cue) => (
                  <div key={cue} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                    <CircleDot size={16} className={`mt-1 shrink-0 ${accent.text}`} />
                    <p className="text-sm leading-6 text-slate-700">{cue}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black">Instagram video</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Paste a public Instagram post, reel URL, or iframe embed code.
                  </p>
                </div>
                <div
                  className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex ${
                    hasVideo ? "bg-emerald-200 text-emerald-900" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <Video size={18} />
                </div>
              </div>
              <label className="mt-4 block">
                <span className="sr-only">Instagram video URL</span>
                <input
                  className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  value={videoInput}
                  onChange={(event) => setVideoInput(event.target.value)}
                  placeholder="https://www.instagram.com/reel/SHORTCODE/"
                />
              </label>
              {videoError ? (
                <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {videoError}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${accent.button}`}
                  onClick={saveVideo}
                >
                  <Video size={17} />
                  Save video
                </button>
                {hasVideo ? (
                  <button
                    className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => {
                      setVideoInput("");
                      setVideoError("");
                      onRemoveVideo(workout.id);
                    }}
                  >
                    <X size={17} />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <button
              className={`focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-black transition ${
                isQueued ? "bg-slate-200 text-slate-500" : accent.button
              }`}
              disabled={isQueued}
              onClick={() => onAdd(workout)}
            >
              {isQueued ? <CheckCircle2 size={18} /> : <Plus size={18} />}
              {isQueued ? "Already in session" : "Add to session"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HistoryList({ history }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Logged work</p>
          <h2 className="text-2xl font-black text-white">Recent sessions</h2>
        </div>
        <CalendarDays className="text-slate-400" size={22} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {history.length ? (
          history.slice(0, 6).map((entry) => (
            <article key={entry.id} className="panel rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{formatDate(entry.finishedAt)}</p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {entry.completed}/{entry.total} completed
                  </h3>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-300 text-slate-950">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {entry.items.map((item) => item.name).join(", ")}
              </p>
            </article>
          ))
        ) : (
          <article className="panel rounded-lg p-5 md:col-span-3">
            <p className="text-sm text-slate-400">Completed sessions will appear here.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function Dashboard({ auth, onLogout }) {
  const [selectedFamilyId, setSelectedFamilyId] = useState(workoutLibrary[0].id);
  const selectedFamily = workoutLibrary.find((family) => family.id === selectedFamilyId);
  const [selectedCategoryId, setSelectedCategoryId] = useState(selectedFamily.categories[0].id);
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [sessionItems, setSessionItems] = useStoredState(SESSION_STORAGE_KEY, []);
  const [history, setHistory] = useStoredState(HISTORY_STORAGE_KEY, []);
  const [exerciseVideos, setExerciseVideos] = useStoredState(VIDEO_STORAGE_KEY, {});

  useEffect(() => {
    setSelectedCategoryId(selectedFamily.categories[0].id);
  }, [selectedFamilyId, selectedFamily.categories]);

  const selectedCategory =
    selectedFamily.categories.find((category) => category.id === selectedCategoryId) ||
    selectedFamily.categories[0];

  const filteredWorkouts = useMemo(() => {
    const source = query.trim()
      ? allWorkouts.filter((workout) => {
          const haystack = [
            workout.name,
            workout.familyName,
            workout.categoryName,
            workout.target,
            workout.equipment,
            workout.muscle,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : selectedCategory.workouts.map((workout) => ({
          ...workout,
          familyId: selectedFamily.id,
          familyName: selectedFamily.name,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          muscle: selectedCategory.muscle,
          accent: selectedFamily.accent,
        }));

    return source.map((workout) => ({
      ...workout,
      videoUrl: exerciseVideos[workout.id] || workout.videoUrl || "",
    }));
  }, [query, selectedCategory, selectedFamily, exerciseVideos]);

  const queuedIds = useMemo(
    () => new Set(sessionItems.map((item) => item.id)),
    [sessionItems],
  );

  const addToSession = (workout) => {
    if (queuedIds.has(workout.id)) {
      return;
    }

    setSessionItems((current) => [
      ...current,
      {
        ...workout,
        sessionId: `${workout.id}-${Date.now()}`,
        completed: false,
      },
    ]);
  };

  const toggleSessionItem = (sessionId) => {
    setSessionItems((current) =>
      current.map((item) =>
        item.sessionId === sessionId ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const removeSessionItem = (sessionId) => {
    setSessionItems((current) => current.filter((item) => item.sessionId !== sessionId));
  };

  const finishSession = () => {
    if (!sessionItems.length) {
      return;
    }

    const completed = sessionItems.filter((item) => item.completed).length;
    setHistory((current) => [
      {
        id: `session-${Date.now()}`,
        finishedAt: new Date().toISOString(),
        completed,
        total: sessionItems.length,
        items: sessionItems,
      },
      ...current,
    ]);
    setSessionItems([]);
  };

  const openWorkout = (workout) => {
    setActiveWorkout(workout);
  };

  const saveExerciseVideo = (workoutId, videoUrl) => {
    setExerciseVideos((current) => ({
      ...current,
      [workoutId]: videoUrl,
    }));
    setActiveWorkout((current) =>
      current?.id === workoutId ? { ...current, videoUrl } : current,
    );
    setSessionItems((current) =>
      current.map((item) => (item.id === workoutId ? { ...item, videoUrl } : item)),
    );
  };

  const removeExerciseVideo = (workoutId) => {
    setExerciseVideos((current) => {
      const next = { ...current };
      delete next[workoutId];
      return next;
    });
    setActiveWorkout((current) =>
      current?.id === workoutId ? { ...current, videoUrl: "" } : current,
    );
    setSessionItems((current) =>
      current.map((item) => (item.id === workoutId ? { ...item, videoUrl: "" } : item)),
    );
  };

  const activeWorkoutFamily =
    activeWorkout &&
    workoutLibrary.find((family) => family.id === (activeWorkout.familyId || selectedFamily.id));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
              <Zap size={23} />
            </div>
            <div>
              <p className="text-xl font-black leading-none">TrainHarder</p>
              <p className="mt-1 hidden text-xs text-slate-400 sm:block">{auth.user.email}</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <a className="text-sm font-semibold text-slate-300 hover:text-white" href="#library">
              Library
            </a>
            <a className="text-sm font-semibold text-slate-300 hover:text-white" href="#session">
              Session
            </a>
            <a className="text-sm font-semibold text-slate-300 hover:text-white" href="#history">
              History
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              className="focus-ring rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <Menu size={22} />
            </button>
            <button
              className="focus-ring flex items-center gap-2 rounded-lg border border-white/12 px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white hover:text-slate-950"
              onClick={onLogout}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <nav className="border-t border-white/10 px-4 py-3 lg:hidden">
            <div className="mx-auto flex max-w-7xl gap-3">
              {["library", "session", "history"].map((item) => (
                <a
                  key={item}
                  className="rounded-md bg-white/8 px-3 py-2 text-sm font-semibold text-slate-200"
                  href={`#${item}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 media-card opacity-34"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.98), rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.95)), url(${selectedFamily.hero})`,
          }}
        />
        <div className="app-grid absolute inset-0 opacity-35" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-16">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-white px-3 py-1 text-sm font-black text-slate-950">
                {selectedFamily.name}
              </span>
              <span className="rounded-md border border-white/14 bg-white/8 px-3 py-1 text-sm font-semibold text-slate-200">
                {selectedFamily.stats}
              </span>
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-none sm:text-6xl">
              Track every discipline from heavy lifting to calm flow.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Build sessions from muscle-focused categories, keep your current workout organized,
              and attach exercise videos as your library grows.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatPill icon={Target} label="Categories" value="32" />
              <StatPill icon={Dumbbell} label="Exercises" value={allWorkouts.length} />
              <StatPill icon={Clock} label="Logged" value={history.length} />
            </div>
          </div>

          <div id="session" className="lg:pt-2">
            <SessionPanel
              sessionItems={sessionItems}
              onToggle={toggleSessionItem}
              onRemove={removeSessionItem}
              onFinish={finishSession}
            />
          </div>
        </div>
      </section>

      <div id="library" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Workout library</p>
            <h2 className="mt-1 text-3xl font-black text-white">Choose a training style</h2>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search exercises</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="focus-ring w-full rounded-lg border border-white/12 bg-white/8 px-10 py-3 text-white outline-none placeholder:text-slate-500"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search muscle, equipment, exercise"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workoutLibrary.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              isActive={selectedFamilyId === family.id && !query}
              onSelect={() => {
                setSelectedFamilyId(family.id);
                setSelectedCategoryId(family.categories[0].id);
                setQuery("");
              }}
            />
          ))}
        </div>

        <section className="mt-10 rounded-lg bg-white p-4 text-slate-950 shadow-edge sm:p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={`text-sm font-black ${accentClasses[selectedFamily.accent].text}`}>
                {query ? "Search results" : selectedFamily.shortName}
              </p>
              <h2 className="text-2xl font-black">
                {query ? `${filteredWorkouts.length} matching exercises` : selectedCategory.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {query ? "Matches across the full training library." : selectedCategory.intent}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              <Sparkles size={17} />
              {selectedFamily.stats}
            </div>
          </div>

          {!query ? (
            <>
              <CategoryTabs
                family={selectedFamily}
                activeCategoryId={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            </>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkouts.map((workout) => {
              const workoutFamily =
                workoutLibrary.find((family) => family.id === workout.familyId) || selectedFamily;

              return (
                <WorkoutCard
                  key={`${workout.familyId}-${workout.id}`}
                  workout={workout}
                  family={workoutFamily}
                  isQueued={queuedIds.has(workout.id)}
                  onAdd={addToSession}
                  onOpen={openWorkout}
                />
              );
            })}
          </div>
        </section>

        <div id="history">
          <HistoryList history={history} />
        </div>
      </div>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-500">
        TrainHarder keeps workout sessions in this browser with local storage.
      </footer>

      <WorkoutDetail
        workout={activeWorkout}
        family={activeWorkoutFamily || selectedFamily}
        isQueued={activeWorkout ? queuedIds.has(activeWorkout.id) : false}
        onClose={() => setActiveWorkout(null)}
        onAdd={addToSession}
        onSaveVideo={saveExerciseVideo}
        onRemoveVideo={removeExerciseVideo}
      />
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => readStoredValue(AUTH_STORAGE_KEY, null));

  const handleLogin = (payload) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  };

  if (!auth?.token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return <Dashboard auth={auth} onLogout={handleLogout} />;
}
