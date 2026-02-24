<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ExchangeAlt } from '@vicons/fa'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import TelegramAddress from './TelegramAddress.vue'
import AddressManagement from '../user/AddressManagement.vue'
import { getRouterPathWithLang } from '../../utils'
import AddressSelect from '../../components/AddressSelect.vue'

const router = useRouter()

const {
    settings, userJwt, isTelegram
} = useGlobalState()

const { locale, t } = useI18n({
    messages: {
        en: {
            userLogin: 'User Login',
            addressManage: 'Manage',
            goToAddresses: 'Go to Address Management',
            noAddressYet: 'You have no email address yet, please create or bind one.',
            loginRequired: 'Please log in to view your inbox',
        },
        zh: {
            userLogin: '用户登录',
            addressManage: '地址管理',
            goToAddresses: '前往地址管理',
            noAddressYet: '你还没有邮箱地址，请先创建或绑定一个。',
            loginRequired: '请登录以查看收件箱',
        }
    }
});

const showAddressManage = ref(false)

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
                <n-empty :description="t('loginRequired')">
                    <template #extra>
                        <n-button type="primary" @click="router.push(getRouterPathWithLang('/auth/login', locale.value))">
                            {{ t('userLogin') }}
                        </n-button>
                    </template>
                </n-empty>
            </n-card>
        </div>
        <n-modal v-model:show="showAddressManage" preset="card" :title="t('addressManage')">
            <TelegramAddress v-if="isTelegram" />
            <AddressManagement v-else-if="userJwt" />
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
