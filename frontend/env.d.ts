// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        DJANGO_API_URL?: string;
        ALLOWED_ORIGINS?: string;
        NEXT_PUBLIC_API_URL?: string;
    }
}

declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}