export {};

declare global {
  interface Window {
    umami?: {
      track: (eventOrProps?: string | Record<string, any> | ((props: any) => Record<string, any>), data?: Record<string, any>) => void;
    };
  }
}
