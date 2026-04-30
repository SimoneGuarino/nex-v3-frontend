import { useNTIFUnreadCount } from "context/NotificationContext";
import { useUserContext } from "context/UserContext";
import React from "react";
import {
    FiSun, FiMoon, FiCloud, FiBell, FiCheckCircle, FiCalendar,
    FiSettings, FiEdit3, FiChevronRight
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const FiSunIcon = FiSun as React.FC<{ className?: string }>;
const FiMoonIcon = FiMoon as React.FC<{ className?: string }>;
const FiCloudIcon = FiCloud as React.FC<{ className?: string }>;
const FiBellIcon = FiBell as React.FC<{ className?: string }>;
const FiCheckCircleIcon = FiCheckCircle as React.FC<{ className?: string }>;
const FiCalendarIcon = FiCalendar as React.FC<{ className?: string }>;
const FiSettingsIcon = FiSettings as React.FC<{ className?: string }>;
const FiEdit3Icon = FiEdit3 as React.FC<{ className?: string }>;
const FiChevronRightIcon = FiChevronRight as React.FC<{ className?: string }>;

type Props = {
    userName?: string;
    avatarUrl?: string;
    loading?: boolean;

    tasksDue?: number;          // es: attività da completare oggi
    notifications?: number;     // es: notifiche non lette
    meetings?: number;          // es: riunioni odierne

    onOpenTasks?: () => void;
    onOpenNotifications?: () => void;
    onOpenCalendar?: () => void;
    onEditProfile?: () => void;
    onOpenSettings?: () => void;

    className?: string;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const SmartTile: React.FC<{
    icon: React.ReactNode;
    label: string;
    value?: number;
    onClick?: () => void;
    ariaLabel?: string;
}> = ({ icon, label, value = 0, onClick, ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={cx(
            "group flex-1 min-w-[140px] rounded-2xl px-4 py-3 text-left",
            "bg-white/60 dark:bg-neutral-800/70 shadow-sm border border-black/5 dark:border-white/10",
            "hover:shadow-md hover:-translate-y-[1px] transition-all"
        )}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
                    {icon}
                </span>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">{label}</div>
            </div>
            <FiChevronRightIcon className="opacity-30 group-hover:opacity-60 transition-opacity" />
        </div>
        <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">
            {value.toLocaleString("it-IT")}
        </div>
    </button>
);

const TimePill: React.FC<{ date: Date; }> = ({ date }) => {
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    const dd = date.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-neutral-800/70 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                <FiCloudIcon />
            </span>
            <span className="font-medium">{dd}</span>
            <span className="opacity-50">•</span>
            <span className="tabular-nums">{hh}:{mm}</span>
        </div>
    );
};

const useNow = () => {
    const [now, setNow] = React.useState(() => new Date());
    React.useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 15_000);
        return () => clearInterval(id);
    }, []);
    return now;
};

const getGreeting = (d: Date) => {
    const h = d.getHours();
    if (h < 5) return { text: "Buona notte", icon: <FiMoonIcon /> };
    if (h < 12) return { text: "Buongiorno", icon: <FiSunIcon /> };
    if (h < 18) return { text: "Buon pomeriggio", icon: <FiSunIcon /> };
    return { text: "Buona sera", icon: <FiMoonIcon /> };
};

const Avatar: React.FC<{ src?: string; name?: string; }> = ({ src, name }) => {
    const initials = (name ?? "?")
        .split(" ").map(s => s[0]?.toUpperCase()).slice(0, 2).join("");
    return !!src ? (
        <img
            src={`${import.meta.env.VITE_API_USERS}${src}`}
            alt={name ?? "avatar"}
            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/70 dark:ring-neutral-700"
        />
    ) : (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-semibold ring-2 ring-white/70 dark:ring-neutral-700">
            {initials || "?"}
        </div>
    );
};

const Skeleton: React.FC = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-6 w-72 rounded bg-black/5 dark:bg-white/10" />
        <div className="flex gap-3">
            <div className="h-20 flex-1 rounded-2xl bg-black/5 dark:bg-white/10" />
            <div className="h-20 flex-1 rounded-2xl bg-black/5 dark:bg-white/10" />
            <div className="h-20 flex-1 rounded-2xl bg-black/5 dark:bg-white/10" />
        </div>
    </div>
);

const WelcomeBackWidget: React.FC<Props> = ({
    avatarUrl,
    loading = false,

    tasksDue = 0,
    meetings = 0,

    onOpenTasks,
    onOpenNotifications,
    onOpenCalendar,
    onOpenSettings,

    className
}) => {
    const [userContext] = useUserContext();
    const navigate = useNavigate();
    const notifications = useNTIFUnreadCount();

    const now = useNow();
    const greet = getGreeting(now);

    const onEditProfile = () => {
        navigate("/profile");
    };

    return (
        <section
            className={cx(
                "relative h-full rounded-2xl p-5 sm:p-6",
                "bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-900/80 dark:to-neutral-900/60",
                "backdrop-blur supports-[backdrop-filter]:backdrop-blur border border-black/5 dark:border-white/10",
                "shadow-sm",
                className
            )}
        >
            {/* decor subtle */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(60%_60%_at_20%_0%,#000_0%,transparent_70%)]">
                <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />
                <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
            </div>

            {(loading || !userContext?.details) ? (
                <Skeleton />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <Avatar src={userContext.details?.immagini?.avatar} name={userContext.details.nome} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-black/5 dark:bg-white/10">
                                        {greet.icon}
                                    </span>
                                    <span className="truncate">{greet.text}</span>
                                </div>
                                <div className="truncate text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                                    Bentornato, {userContext.details.nome}
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <TimePill date={now} />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            onClick={onEditProfile}
                            className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 curosor-pointer
                            bg-white/70 dark:bg-neutral-800/70 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:shadow-sm hover:-translate-y-[1px] transition-all"
                        >
                            <FiEdit3Icon /> Modifica profilo
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 curosor-pointer
                            bg-white/70 dark:bg-neutral-800/70 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:shadow-sm hover:-translate-y-[1px] transition-all"
                        >
                            <FiSettingsIcon /> Impostazioni
                        </button>
                    </div>

                    {/* Smart tiles */}
                    <div className="flex gap-3 flex-wrap mt-5">
                        <SmartTile
                            icon={<FiCheckCircleIcon />}
                            label="Attività di oggi"
                            value={tasksDue}
                            onClick={onOpenTasks}
                            ariaLabel="Apri attività di oggi"
                        />
                        <SmartTile
                            icon={<FiBellIcon />}
                            label="Notifiche"
                            value={notifications}
                            onClick={onOpenNotifications}
                            ariaLabel="Apri notifiche"
                        />
                        <SmartTile
                            icon={<FiCalendarIcon />}
                            label="Riunioni"
                            value={meetings}
                            onClick={onOpenCalendar}
                            ariaLabel="Apri calendario"
                        />
                    </div>
                </>
            )}
        </section>
    );
};

export default WelcomeBackWidget;
