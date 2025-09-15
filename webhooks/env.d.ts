export interface CloudflareBindings {
    DATABASE: D1Database;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}
