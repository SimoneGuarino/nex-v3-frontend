import { Divider } from '@mui/material';
import { useNexTheme } from '@nex/theme-system';
import { MainTheme } from 'assets/settingsTheme';
import React from 'react';

export const allEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
    '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺',
    '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉',
    '🙊', '🐵', '🐒', '🦍', '🐶', '🐕', '🐩', '🐺', '🦊', '🦝',
    '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓',
    '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏',
    '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭',
    '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨',
    '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓',
    '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉',
    '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉',
    '🦕', '🦖', '🐳', '🐋', '🐬', '🐟', '🐠', '🐡', '🦈', '🐙',
    '🐚', '🦀', '🦐', '🦑', '🦪', '🦋', '🐌', '🐛', '🐜', '🐝',
    '🦟', '🦠', '🐞', '🦗', '🦂', '💐', '🌸', '💮', '🏵️', '🌹',
    '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵',
    '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦧',
    '🦨', '🦥', '🐁', '🐭', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔',
    '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾',
];

interface SimpleEmojiPickerProps {
    onEmojiClick: (emoji: { emoji: string }) => void;
}

export const SimpleEmojiPicker: React.FC<SimpleEmojiPickerProps> = ({ onEmojiClick }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [mostUsedEmojis, setMostUsedEmojis] = React.useState<string[]>([]);

    React.useEffect(() => {
        // Carica le emoji più utilizzate da localStorage (se presenti)
        const storedEmojis = localStorage.getItem('mostUsedEmojis');
        if (storedEmojis) {
            setMostUsedEmojis(JSON.parse(storedEmojis));
        }
    }, []);

    const handleEmojiClick = (emoji: string) => {
        onEmojiClick({ emoji });

        // Aggiorna le emoji più utilizzate
        setMostUsedEmojis((prevEmojis: any) => {
            const updatedEmojis = [emoji, ...prevEmojis.filter((e: any) => e !== emoji)];
            const uniqueEmojis = [...new Set(updatedEmojis)]; // Rimuove i duplicati

            // Limita la lista a 10 emoji
            const limitedEmojis = uniqueEmojis.slice(0, 10);

            // Salva in localStorage
            localStorage.setItem('mostUsedEmojis', JSON.stringify(limitedEmojis));

            return limitedEmojis;
        });
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', maxHeight: '300px', overflowY: 'scroll', padding: "16px", borderBottom: `1px solid ${darkMode ? palette.grey[800] : '#e7e7e7'}`}}>
            {mostUsedEmojis.length > 0 && (
                <>
                    <h4 style={{ width: '100%' }}>Emoji più utilizzate</h4>
                    {mostUsedEmojis.map((emoji: any, i: number) => (
                        <button
                            key={emoji + i}
                            style={{ fontSize: '1.5rem', margin: '5px', border: 'none', background: 'none', cursor: 'pointer' }}
                            onClick={() => handleEmojiClick(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                    <Divider sx={{width: '100%', backgroundColor: `${darkMode ? palette.grey[800] : '#e7e7e7'}`}}/>
                </>
            )}
            <h4 style={{ width: '100%' }}>Tutte le emoji</h4>
            {allEmojis.map((emoji: any, i: number) => (
                <button
                    key={i}
                    style={{ fontSize: '1.5rem', margin: '5px', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => handleEmojiClick(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default SimpleEmojiPicker;