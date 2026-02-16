import * as Sentry from '@sentry/nextjs';

const dsn = process.env.GLITCHTIP_DSN ?? process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    release: process.env.APP_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.05,
});
