<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { User, ExchangeAlt } from '@vicons/fa'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import TelegramAddress from './TelegramAddress.vue'
import LocalAddress from './LocalAddress.vue'
import AddressManagement from '../user/AddressManagement.vue'
import { getRouterPathWithLang } from '../../utils'
import AddressSelect from '../../components/AddressSelect.vue'

const router = useRouter()

const {
    jwt, settings, showAddressCredential, userJwt,
    isTelegram, addressPassword
} = useGlobalState()

const { locale, t } = useI18n({
    messages: {
        en: {
            ok: 'OK',
            fetchAddressError: 'Mail address credential is invalid or account not exist, it may be network connection issue, please try again later.',
            addressCredential: 'Mail Address Credential',
            linkWithAddressCredential: 'Open to auto login email link',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login to your email account.',
            addressPassword: 'Address Password',
            userLogin: 'User Login',
            addressManage: 'Manage',
            goToAddresses: 'Go to Address Management',
            noAddressYet: 'You have no email address yet, please create or bind one.',
        },
        zh: {
            ok: '确定',
            fetchAddressError: '邮箱地址凭证无效或邮箱地址不存在，也可能是网络连接异常，请稍后再尝试。',
            addressCredential: '邮箱地址凭证',
            linkWithAddressCredential: '打开即可自动登录邮箱的链接',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            addressPassword: '地址密码',
            userLogin: '用户登录',
            addressManage: '地址管理',
            goToAddresses: '前往地址管理',
            noAddressYet: '你还没有邮箱地址，请先创建或绑定一个。',
        }
    }
});

const showAddressManage = ref(false)

const getUrlWithJwt = () => {
    return `${window.location.origin}/?jwt=${jwt.value}`
}

const onUserLogin = async () => {
    await router.push(getRouterPathWithLang("/auth/login", locale.value))
}

onMounted(async () => {
    await api.getSettings();
});
</script>

<template>
    <div>
        <n-card :bordered="false" embedded v-if="!settings.fetched">
            <n-skeleton style="height: 50vh" />
        </n-card>
        <div v-else-if="settings.address" class="address-bar">
            <AddressSelect>
                <template #actions>
                    <n-button class="address-manage" size="small" tertiary type="primary"
                        @click="showAddressManage = true">
                        <n-icon :component="ExchangeAlt" />
                        {{ t('addressManage') }}
                    </n-button>
                </template>
            </AddressSelect>
        </div>
        <div v-else-if="isTelegram">
            <TelegramAddress />
        </div>
        <div v-else-if="userJwt" class="center">
            <n-card :bordered="false" embedded style="max-width: 600px;">
                <n-empty :description="t('noAddressYet')">
                    <template #extra>
                        <n-button type="primary" @click="router.push(getRouterPathWithLang('/addresses', locale.value))">
                            {{ t('goToAddresses') }}
                        </n-button>
                    </template>
                </n-empty>
            </n-card>
        </div>
        <div v-else class="center">
            <n-card :bordered="false" embedded style="max-width: 600px;">
                <n-alert v-if="jwt" type="warning" :show-icon="false" :bordered="false" closable>
                    <span>{{ t('fetchAddressError') }}</span>
                </n-alert>
                <Login />
                <n-divider />
                <n-button @click="onUserLogin" type="primary" block secondary strong>
                    <template #icon>
                        <n-icon :component="User" />
                    </template>
                    {{ t('userLogin') }}
                </n-button>
            </n-card>
        </div>
        <n-modal v-model:show="showAddressCredential" preset="dialog" :title="t('addressCredential')">
            <span>
                <p>{{ t("addressCredentialTip") }}</p>
            </span>
            <n-card embedded>
                <b>{{ jwt }}</b>
            </n-card>
            <n-card embedded v-if="addressPassword">
                <p><b>{{ settings.address }}</b></p>
                <p>{{ t('addressPassword') }}: <b>{{ addressPassword }}</b></p>
            </n-card>
            <n-card embedded>
                <n-collapse>
                    <n-collapse-item :title='t("linkWithAddressCredential")'>
                        <n-card embedded>
                            <b>{{ getUrlWithJwt() }}</b>
                        </n-card>
                    </n-collapse-item>
                </n-collapse>
            </n-card>
        </n-modal>
        <n-modal v-model:show="showAddressManage" preset="card" :title="t('addressManage')">
            <TelegramAddress v-if="isTelegram" />
            <AddressManagement v-else-if="userJwt" />
            <LocalAddress v-else />
        </n-modal>
    </div>
</template>

<style scoped>
.address-bar {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: var(--ds-radius-sm, 8px);
    background: var(--ds-surface, #fff);
    box-shadow: var(--ds-shadow, 0 1px 3px rgba(0,0,0,0.04));
    text-align: center;
}

.n-card {
    margin-top: 10px;
}

.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
    margin: 20px;
}

.address-manage {
    flex: 0 0 auto;
    white-space: nowrap;
}
</style>
