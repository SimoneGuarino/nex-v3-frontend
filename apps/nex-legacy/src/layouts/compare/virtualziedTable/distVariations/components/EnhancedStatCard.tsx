import React, { ReactNode, useId } from 'react';
import { Card, CardContent, Typography, useTheme, IconButton, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Tooltip as RechartsTooltip,
    Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import MDTypography from 'components/MDTypography';

interface subtitleNodeProps {
    positive: boolean;
    pct: number;
    desc?: string;
}

export const SubtitleNode = ({ positive, pct, desc }: subtitleNodeProps) => {
    const badge = (
        <span className={`inline-block text-xs font-medium ${positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            } !px-2 !py-0.5 rounded-full`}>
            {positive ? '+' : ''}{pct.toFixed(1)}%
        </span>
    );

    return (
        <Box component="div"  className="flex items-center !space-x-1 text-gray-500 text-xs">
            {badge}
            <span>{desc ? desc : "vs last month"}</span>
        </Box>
    );
}

interface EnhancedStatCardProps {
    title: string;
    value: string | number;
    description: string;
    subtitle?: ReactNode;
    extra?: ReactNode;
    positive?: boolean;
    borderColorKey?: 'success' | 'error' | 'warning' | 'primary';
    /** Optional sparkline data: array of numeric values or { x: number; y: number } */
    sparkData?: number[] | { x: number; y: number }[];
    /** Color for sparkline (MUI palette key or hex) */
    sparkColor?: string;
    /** Layout orientation */
    layout?: 'vertical' | 'horizontal';
}

export const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
    title,
    value,
    description,
    subtitle,
    extra,
    positive,
    borderColorKey = 'primary',
    sparkData,
    sparkColor,
    layout = 'horizontal',
}) => {
    const theme = useTheme();
    const borderColor = theme.palette[borderColorKey].main;
    const lineColor = sparkColor || theme.palette[positive ? 'success' : 'error'].main;

    // Normalize sparkData to array of { x, y }
    const data = React.useMemo(() => {
        if (!sparkData) return [];
        return sparkData.map((d, i) =>
            typeof d === 'object' ? d : { x: i, y: d }
        );
    }, [sparkData]);

    const gradientId = useId();
    const renderChart = () => (
        <Box component="div"  className="w-32 h-16">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="y"
                        stroke={lineColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                    />
                    <RechartsTooltip
                        cursor={false}
                        contentStyle={{ display: 'none' }}
                        active={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    )

    return (
        <Card
            className="relative border-l-4 max-w-sm dark:!bg-neutral-800 rounded-xl shadow hover:shadow-md transition-shadow !p-6"
            sx={{ borderColor }}
        >
                <Box component="div"  className="flex items-center justify-between">
                    <MDTypography variant="subtitle2" className="uppercase text-gray-700 font-medium">
                        {title}
                    </MDTypography>
                    <IconButton
                        size="small"
                        className="p-0"
                        data-tooltip-content={description}
                        data-tooltip-id="general-tooltip"
                    >
                        <InfoOutlinedIcon fontSize="small" className="text-gray-400 hover:text-gray-600" />
                    </IconButton>
                </Box>
                <Box component="div"  className={layout === 'horizontal' ? 'flex items-center justify-between space-x-4' : 'space-y-2'}>
                    <Typography
                        variant="h4"
                        className={`font-extrabold ${positive === undefined
                            ? 'text-gray-800'
                            : positive
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                    >
                        {value}
                    </Typography>

                    {layout === 'horizontal' && data.length >= 2 && renderChart()}
                </Box>

                {layout === 'vertical' && data.length >= 2 && (
                    <Box component="div"  className="w-full h-24 mt-4">
                        {renderChart()}
                    </Box>
                )}
                {subtitle && (
                    <Box component="div"  className="mt-1">
                        {typeof subtitle === 'string'
                            ? <Typography variant="caption" className="text-gray-500">{subtitle}</Typography>
                            : subtitle
                        }
                    </Box>
                )}
                {extra && extra}
        </Card>
    );
};
