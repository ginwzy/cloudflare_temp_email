const API_PATHS = [
    "/api/",
    "/open_api/",
    "/user_api/",
    "/admin/",
    "/telegram/",
    "/external/",
];

// Frontend SPA routes under /admin that should NOT be proxied to backend
const ADMIN_SPA_PATHS = [
    "/admin/dashboard",
    "/admin/accounts",
    "/admin/users",
    "/admin/emails",
    "/admin/security",
    "/admin/integrations",
    "/admin/maintenance",
    "/admin/appearance",
    "/admin/about",
];

export async function onRequest(context) {
    const reqPath = new URL(context.request.url).pathname;
    // Let frontend SPA handle its own routes
    if (ADMIN_SPA_PATHS.some(path => reqPath.startsWith(path))) {
        return await context.next();
    }
    if (API_PATHS.some(path => reqPath.startsWith(path))) {
        return context.env.BACKEND.fetch(context.request);
    }
    return await context.next();
}
