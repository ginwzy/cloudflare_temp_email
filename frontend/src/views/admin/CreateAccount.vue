<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const {
    loading, openSettings,
} = useGlobalState()
const message = useMessage()

const { t } = useI18n({
    messages: {
        en: {
            address: 'Address',
            enablePrefix: 'If enable Prefix',
            creatNewEmail: 'Create New Email',
            fillInAllFields: 'Please fill in all fields',
            successTip: 'Success Created',
            createdAddress: 'Created Address',
            addressPassword: 'Address Password',
            tags: 'Tags',
            tagsTip: 'Press Enter to add tags (optional)',
        },
        zh: {
            address: '地址',
            enablePrefix: '是否启用前缀',
            creatNewEmail: '创建新邮箱',
            fillInAllFields: '请填写完整信息',
            successTip: '创建成功',
            createdAddress: '创建的地址',
            addressPassword: '地址密码',
            tags: '标签',
            tagsTip: '按回车添加标签（可选）',
        }
    }
});

const enablePrefix = ref(true)
const emailName = ref("")
const emailDomain = ref("")
const emailTags = ref([])
const showReultModal = ref(false)
const addressPassword = ref("")
const createdAddress = ref("")

const newEmail = async () => {
    if (!emailName.value || !emailDomain.value) {
        message.error(t('fillInAllFields'))
        return
    }
    try {
        const res = await api.fetch(`/admin/new_address`, {
            method: 'POST',
            body: JSON.stringify({
                enablePrefix: enablePrefix.value,
                name: emailName.value,
                domain: emailDomain.value,
                tags: emailTags.value.length > 0 ? emailTags.value : undefined,
            })
        })
        addressPassword.value = res["password"] || '';
        createdAddress.value = res["address"] || '';
        message.success(t('successTip'))
        showReultModal.value = true
    } catch (error) {
        message.error(error.message || "error");
    }
}

watch(
    () => openSettings.value.prefix,
    (prefix) => {
        enablePrefix.value = !!prefix
    },
    { immediate: true }
)

watch(
    () => openSettings.value.domains,
    (domains) => {
        if (!emailDomain.value && domains?.length) {
            emailDomain.value = domains[0].value
        }
    },
    { immediate: true }
)
</script>

<template>
    <div class="center">
        <n-modal v-model:show="showReultModal" preset="dialog" :title="t('successTip')">
            <n-card embedded>
                <p>{{ t('createdAddress') }}: <b>{{ createdAddress }}</b></p>
                <p v-if="addressPassword">{{ t('addressPassword') }}: <b>{{ addressPassword }}</b></p>
            </n-card>
        </n-modal>
        <n-card :bordered="false" embedded style="max-width: 600px;">
            <n-form-item-row v-if="openSettings.prefix" :label="t('enablePrefix')">
                <n-switch v-model:value="enablePrefix" :round="false" />
            </n-form-item-row>
            <n-form-item-row :label="t('address')">
                <n-input-group>
                    <n-input-group-label v-if="enablePrefix && openSettings.prefix">
                        {{ openSettings.prefix }}
                    </n-input-group-label>
                    <n-input v-model:value="emailName" />
                    <n-input-group-label>@</n-input-group-label>
                    <n-select v-model:value="emailDomain" :consistent-menu-width="false"
                        :options="openSettings.domains" />
                </n-input-group>
            </n-form-item-row>
            <n-form-item-row :label="t('tags')">
                <n-dynamic-tags v-model:value="emailTags" />
            </n-form-item-row>
            <n-button @click="newEmail" type="primary" block :loading="loading">
                {{ t('creatNewEmail') }}
            </n-button>
        </n-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
    margin: 20px;
}
</style>
