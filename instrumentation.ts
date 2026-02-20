import { initializeSentry, sentryUtils } from './lib/monitoring/sentry';

export async function register() {
  // Single centralized initialization
  initializeSentry();
}

export const onRequestError = (error: any, request: any) => {
  sentryUtils.captureError(error, { 
    request: {
      url: request?.url,
      method: request?.method,
      headers: request?.headers,
    }
  });
};
