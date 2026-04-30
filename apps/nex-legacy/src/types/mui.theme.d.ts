// src/@types/mui-theme.d.ts
import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        borders: {
            borderRadius: Record<string, string>;
        };
        functions: {
            linearGradient: (color1: string, color2: string) => string;
        };
        boxShadows: {
            colored: Record<string, string>;
            [key: string]: any;
        };
    }
    interface ThemeOptions {
        borders?: {
            borderRadius?: Record<string, string>;
        };
        functions?: {
            linearGradient?: (color1: string, color2: string) => string;
        };
        boxShadows?: {
            colored?: Record<string, string>;
            [key: string]: any;
        };
    }
}