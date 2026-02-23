import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import SettingsLayout from '../layouts/SettingsLayout.vue'
import InboxView from '../views/pages/InboxView.vue'
import i18n from '../i18n'
import { useGlobalState } from '../store'

const { jwt } = useGlobalState()

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Auth routes
        {
            path: '/auth',
            component: AuthLayout,
            children: [
                { path: 'login', alias: '/:lang/auth/login', component: () => import('../views/auth/AuthLogin.vue') },
                { path: 'register', alias: '/:lang/auth/register', component: () => import('../views/auth/AuthRegister.vue') },
                { path: 'forgot-password', alias: '/:lang/auth/forgot-password', component: () => import('../views/auth/AuthForgotPassword.vue') },
                { path: 'oauth2/callback', alias: '/:lang/auth/oauth2/callback', component: () => import('../views/user/UserOauth2Callback.vue') },
            ]
        },

        // Main app routes
        {
            path: '/',
            component: AppLayout,
            children: [
                { path: '', alias: '/:lang/', component: InboxView },
                { path: 'inbox', alias: '/:lang/inbox', component: InboxView },
                { path: 'sent', alias: '/:lang/sent', component: () => import('../views/pages/SentView.vue') },
                { path: 'compose', alias: '/:lang/compose', component: () => import('../views/pages/ComposeView.vue') },
                { path: 'addresses', alias: '/:lang/addresses', component: () => import('../views/addresses/AddressesView.vue') },
                { path: 'addresses/new', alias: '/:lang/addresses/new', component: () => import('../views/addresses/NewAddressView.vue') },

                // Settings sub-routes
                {
                    path: 'settings',
                    component: SettingsLayout,
                    children: [
                        { path: '', redirect: '/settings/account' },
                        { path: 'account', alias: '/:lang/settings/account', component: () => import('../views/settings/AccountSettings.vue') },
                        { path: 'appearance', alias: '/:lang/settings/appearance', component: () => import('../views/settings/AppearanceSettings.vue') },
                        { path: 'auto-reply', alias: '/:lang/settings/auto-reply', component: () => import('../views/settings/AutoReplySettings.vue') },
                        { path: 'webhook', alias: '/:lang/settings/webhook', component: () => import('../views/settings/WebhookSettings.vue') },
                        { path: 'attachments', alias: '/:lang/settings/attachments', component: () => import('../views/settings/AttachmentSettings.vue') },
                        { path: 'about', alias: '/:lang/settings/about', component: () => import('../views/settings/AboutSettings.vue') },
                    ]
                },
            ]
        },

        // Admin routes
        {
            path: '/admin',
            component: AdminLayout,
            children: [
                { path: '', redirect: '/admin/dashboard' },
                { path: 'dashboard', alias: '/:lang/admin/dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
                { path: 'accounts', alias: '/:lang/admin/accounts', component: () => import('../views/admin/AdminAccounts.vue') },
                { path: 'users', alias: '/:lang/admin/users', component: () => import('../views/admin/AdminUsersPage.vue') },
                { path: 'emails', alias: '/:lang/admin/emails', component: () => import('../views/admin/AdminEmailsPage.vue') },
                { path: 'security', alias: '/:lang/admin/security', component: () => import('../views/admin/AdminSecurityPage.vue') },
                { path: 'integrations', alias: '/:lang/admin/integrations', component: () => import('../views/admin/AdminIntegrationsPage.vue') },
                { path: 'maintenance', alias: '/:lang/admin/maintenance', component: () => import('../views/admin/AdminMaintenancePage.vue') },
                { path: 'appearance', alias: '/:lang/admin/appearance', component: () => import('../views/admin/AdminAppearancePage.vue') },
                { path: 'about', alias: '/:lang/admin/about', component: () => import('../views/admin/AdminAboutPage.vue') },
            ]
        },

        // Telegram standalone
        {
            path: '/telegram_mail',
            alias: '/:lang/telegram_mail',
            component: () => import('../views/telegram/Mail.vue')
        },

        // Legacy redirects
        { path: '/user', redirect: '/settings/account' },
        { path: '/user/oauth2/callback', redirect: '/auth/oauth2/callback' },
        { path: '/:lang/user', redirect: '/settings/account' },
        { path: '/:lang/user/oauth2/callback', redirect: '/auth/oauth2/callback' },
        { path: '/:lang/admin', redirect: '/admin/dashboard' },

        // Catch-all
        {
            name: 'not-found',
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ]
});

router.beforeEach((to, from, next) => {
    if (to.params.lang && ['en', 'zh'].includes(to.params.lang)) {
        i18n.global.locale.value = to.params.lang
    } else {
        i18n.global.locale.value = 'zh'
    }
    if (to.query.jwt) {
        jwt.value = to.query.jwt;
    }
    next()
});

export default router
