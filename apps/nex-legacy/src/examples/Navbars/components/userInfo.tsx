import React from 'react';

// Global State Hook User
import { UserContext } from "context/UserContext";

import "../style.scss";
import { BsStars } from "react-icons/bs";
import { FDBox } from '@nex/fd-ui';

import defaultAvatar from "assets/images/blank-profile-picture-973460_960_720.webp";
import { ContextMenu } from '@nex/fd-ui';


const CoverWithAvatar: React.FC<{ coverSrc?: string | null; src?: string | null; nome?: string; cognome?: string; bio?: string }> =
    ({ coverSrc, src, nome, cognome, bio }) => {
        return <div className="w-full h-40 flex flex-col relative mb-4">
            <FDBox
                className="relative h-full w-62 absolute -left-1 -top-1 rounded-2xl"
                style={{
                    background: coverSrc
                        ? `url(${`${import.meta.env.VITE_API_USERS}${coverSrc}`}) center/cover no-repeat`
                        : "radial-gradient(1000px 400px at -10% -20%, rgba(169, 85, 247, 0.52), transparent 60%), radial-gradient(1000px 450px at 110% -15%, rgba(59, 131, 246, 0.59), transparent 60%), #0d0e124d",
                }}
            >
                <FDBox
                    className='absolute inset-0 w-full h-full'
                    style={{
                        background: "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.35))",
                    }}
                />
                <div className="w-full self-end justify-items-center absolute -bottom-5">
                    <div className="rounded-full w-14 h-14 overflow-hidden">
                        <img src={src ?
                            `${import.meta.env.VITE_API_USERS}${src}` : defaultAvatar} />
                    </div>
                </div>
            </FDBox>
            <div className='mt-8'>
                <p className="text-white font-semibold text-center">{nome} {cognome}</p>
                <p className='text-gray-500 text-center text-xs'>{bio || "Nessuna Biografia"}</p>
            </div>
        </div>
    }

const StarIcon = BsStars as React.FC<{ size?: number; className?: string }>;

export const UserAvatar: React.FC<{
    src?: string | null; className?: string; textSize?: 'xs' | 'md' | 'lg'; cover?: {
        src: string | undefined | null;
        active: boolean;
    };
    name?: string; cognome?: string; size?: number; bio?: string;
}> = ({ src, name, cognome, className, textSize = 'md', size = 10, cover, bio }) => {
        const [userMenu, setUserMenu] = React.useState(false);
        const userMenuRef = React.useRef<HTMLDivElement>(null);
        const contextMenuUSER = [
            {
                title: '',
                className: '!p-0 !w-60',
                icon: <CoverWithAvatar src={src} coverSrc={cover?.src} nome={name} cognome={cognome} bio={bio} />,
                action: false
            }
        ];

        const initials = (name ?? "?")
            .split(" ").map(s => s[0]?.toUpperCase()).slice(0, 2).join("");

        return <>
            {!!src ? (<div ref={userMenuRef}
                onMouseEnter={() => cover?.active && setUserMenu(true)} onMouseLeave={() => cover?.active && setUserMenu(false)}
                className={`cursor-pointer ${className}`}>
                <img
                    src={`${import.meta.env.VITE_API_USERS}${src}`}
                    alt={name ?? "avatar"}
                    className={`h-${size} w-${size} rounded-2xl object-cover ring-2 ring-white/70 dark:ring-neutral-700`}
                    data-tooltip-id='btn-sidenav-icon-tooltip'
                    data-tooltip-content={!!!(cover?.active) ? (name + " " + (cognome ?? "") || "Utente senza nome") : ""}
                /></div>
            ) : (
                <div
                    data-tooltip-id='btn-sidenav-icon-tooltip'
                    data-tooltip-content={!!!(cover?.active) ? (name + " " + (cognome ?? "") || "Utente senza nome") : ""}
                    ref={userMenuRef}
                    onMouseEnter={() => cover?.active && setUserMenu(true)} onMouseLeave={() => cover?.active && setUserMenu(false)}
                    className={`h-${size} w-${size} rounded-2xl text-${textSize} ${className}
                    bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex 
                    items-center justify-center font-semibold ring-2 ring-white/70 dark:ring-neutral-700`}>
                    {initials || "?"}
                </div>
            )}

            {cover?.active && <ContextMenu
                openFor={userMenu}
                pos={userMenuRef}
                onClose={() => setUserMenu(false)}
                menuButtons={contextMenuUSER}
            />}
        </>
};

interface UserContextProps {
    details: {
        ruolo: string;
        nome: string;
        cognome: string;
        multiRuolo: string[];
    };
    token: string;
};

interface UserInfoProps {
    menuRef: React.RefObject<HTMLDivElement>;
    status: boolean;
    open: () => void;
};

export const UserInfo: React.FC<UserInfoProps> = ({ menuRef, status, open }) => {
    const [userContext] = React.useContext<UserContextProps | any>(UserContext);

    return (<div className='flex mr-2 items-center hover:bg-gray-100 px-2
        dark:hover:bg-neutral-700 transition-colors duration-200 cursor-pointer rounded-md'
        ref={menuRef} onClick={open} translate="no" data-tour="global-tour-entry"
    >
        <UserAvatar src={userContext.details?.immagini?.avatar} name={userContext.details?.nome} cognome={userContext.details?.cognome} />
        <StarIcon className='text-indigo-500 animate-bounce' />
    </div>
    );
};