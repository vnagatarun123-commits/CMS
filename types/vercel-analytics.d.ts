declare module '@vercel/analytics/next' {
  export interface AnalyticsProps {
    beforeSend?: (event: any) => any;
    debug?: boolean;
    mode?: 'development' | 'production' | 'test';
  }
  export const Analytics: (props: AnalyticsProps) => any;
}
