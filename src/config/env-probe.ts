const im: any = import.meta;
export const probe = {
  t: typeof im,
  env: im?.env?.VITE_DEV_MODE,
  eq: im?.env?.VITE_DEV_MODE === "true",
  appcfg: (window as any).__APP_CONFIG__?.DEV_MODE,
};
