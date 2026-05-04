import React from 'react';

import FDBox from 'components/UI/box/FDBox';

import defaultAvatar from "../../../assets/images/blank-profile-picture-973460_960_720.webp";
import { ContextMenu } from 'components/UI/menu/ContextMenu';


const CoverWithAvatar: React.FC<{ coverSrc?: string | null; src?: string | null; nome?: string; cognome?: string; bio?: string; args: { API_USERS: string } }> =
    ({ coverSrc, src, nome, cognome, bio, args }) => {
        return <div className="w-full h-40 flex flex-col relative mb-4">
            <FDBox
                className="relative h-full w-62 absolute -left-1 -top-1 rounded-2xl"
                style={{
                    background: coverSrc
                        ? `url(${`${args.API_USERS}${coverSrc}`}) center/cover no-repeat`
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
                            `${args.API_USERS}${src}` : defaultAvatar} />
                    </div>
                </div>
            </FDBox>
            <div className='mt-8'>
                <p className="text-white font-semibold text-center">{nome} {cognome}</p>
                <p className='text-gray-500 text-center text-xs'>{bio || "Nessuna Biografia"}</p>
            </div>
        </div>
    }

export const UserAvatar: React.FC<{
    src?: string | null; className?: string; textSize?: 'xs' | 'md' | 'lg'; cover?: {
        src: string | undefined | null;
        active: boolean;
    };
    name?: string; cognome?: string; size?: number; bio?: string;
    args: {
        API_USERS: string;
    }
}> =
    ({ src, name, cognome, className, textSize = 'md', size = 10, cover, bio, args }) => {
        const [userMenu, setUserMenu] = React.useState(false);
        const userMenuRef = React.useRef<HTMLDivElement>(null);
        const contextMenuUSER = [
            {
                title: '',
                className: '!p-0 !w-60',
                icon: <CoverWithAvatar src={src} coverSrc={cover?.src} nome={name} cognome={cognome} bio={bio} args={args} />,
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
                    src={`${args.API_USERS}${src}`}
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