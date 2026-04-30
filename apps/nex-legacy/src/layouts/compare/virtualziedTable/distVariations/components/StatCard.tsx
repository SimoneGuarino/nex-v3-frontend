// src/components/StatCard.tsx
import React from 'react';
import { Card, CardContent, Typography, useTheme, Box } from '@mui/material';
import MDTypography from 'components/MDTypography';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  positive?: boolean;      // per colorare verde/rosso
  borderColorKey?: 'success' | 'error' | 'primary' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, positive, borderColorKey = 'primary'
}) => {
  const theme = useTheme();
  const borderColor = theme.palette[borderColorKey].main;

  return (
    <Card className="border-l-4 mx-auto w-full dark:!bg-neutral-800" sx={{ borderColor }}>
      <CardContent className="flex flex-col items-center space-y-2">
        <MDTypography variant="subtitle2" className="uppercase">
          {title}
        </MDTypography>
        <MDTypography
          variant="h4"
          className={positive === undefined
            ? 'text-gray-800'
            : positive
              ? 'text-green-600'
              : 'text-red-600'
          }
        >
          {value}
        </MDTypography>
        {subtitle && (
          <Typography variant="caption" className="text-gray-500">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
