import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../views/MainLayout.vue'
import ClassicLayout from '../views/ClassicLayout.vue'
import InboxView from '../views/pages/InboxView.vue'
import i18n from '../i18n'
import { useGlobalState } from '../store'

const { jwt } = useGlobalState()

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: MainLayout,
            children: [
                { path: '', alias: '/:lang/', component: InboxView },
                { path: 'sent', alias: '/:lang/sent', component: () => import('../views/pages/SentView.vue') },
                { path: 'compose', alias: '/:lang/compose', component: () => import('../views/pages/ComposeView.vue') },
                { path: 'settings', alias: '/:lang/settings', component: () => import('../views/Settings.vue') },
            ]
        },
        {
            path: '/user',
            component: ClassicLayout,
            children: [
                { path: '', alias: '/:lang/user', component: () => import('../views/User.vue') },
                { path: 'oauth2/callback', alias: '/:lang/user/oauth2/callback', component: () => import('../views/user/UserOauth2Callback.vue') },
            ]
        },
        {
            path: '/admin',
            alias: '/:lang/admin',
            component: ClassicLayout,
            children: [
                { path: '', component: () => import('../views/Admin.vue') },
            ]
        },
        {
            path: '/telegram_mail',
            alias: '/:lang/telegram_mail',
            component: () => import('../views/telegram/Mail.vue')
        },
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
