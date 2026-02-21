<script setup>
import { ref, h, onMounted } from 'vue';
import { NButton, NTag, NSpace } from 'naive-ui';
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading } = useGlobalState()
const message = useMessage()

const { t } = useI18n({
    messages: {
        en: {
            title: 'API Key Management',
            name: 'Name',
            apiKey: 'API Key',
            usage: 'Usage',
            status: 'Status',
            createdAt: 'Created At',
            actions: 'Actions',
            create: 'Create API Key',
            keyName: 'Key Name',
            maxCalls: 'Max Calls',
            delete: 'Delete',
            deleteTip: 'Are you sure to delete this API key?',
            resetUsage: 'Reset Usage',
            resetTip: 'Are you sure to reset usage count?',
            active: 'Active',
            inactive: 'Inactive',
            success: 'Success',
            copySuccess: 'Copied to clipboard',
            copy: 'Copy',
            newKeyTip: 'Please save this key now. You will not be able to see it again.',
            newKeyTitle: 'API Key Created',
            itemCount: 'Total',
        },
        zh: {
            title: 'API Key 管理',
            name: '名称',
            apiKey: 'API Key',
            usage: '用量',
            status: '状态',
            createdAt: '创建时间',
            actions: '操作',
            create: '创建 API Key',
            keyName: 'Key 名称',
            maxCalls: '调用上限',
            delete: '删除',
            deleteTip: '确定要删除这个 API Key 吗？',
            resetUsage: '重置用量',
            resetTip: '确定要重置调用次数吗？',
            active: '启用',
            inactive: '禁用',
            success: '成功',
            copySuccess: '已复制到剪贴板',
            copy: '复制',
            newKeyTip: '请立即保存此 Key，之后将无法再次查看。',
            newKeyTitle: 'API Key 已创建',
            itemCount: '总数',
        }
    }
});

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showCreateModal = ref(false)
const newKeyName = ref('')
const newKeyMaxCalls = ref(1000)

const showNewKeyModal = ref(false)
const createdKey = ref('')

const showDeleteConfirm = ref(false)
const deleteTargetId = ref(0)
const showResetConfirm = ref(false)
const resetTargetId = ref(0)

const columns = [
    { title: () => t('name'), key: 'name', ellipsis: true },
    {
        title: () => t('apiKey'), key: 'api_key',
        render: (row) => h('code', null, row.api_key.slice(0, 8) + '...' + row.api_key.slice(-4))
    },
    {
        title: () => t('usage'), key: 'used_calls',
        render: (row) => `${row.used_calls} / ${row.max_calls}`
    },
    {
        title: () => t('status'), key: 'is_active',
        render: (row) => h(NTag, { type: row.is_active ? 'success' : 'error', size: 'small' },
            () => row.is_active ? t('active') : t('inactive'))
    },
    { title: () => t('createdAt'), key: 'created_at', width: 180 },
    {
        title: () => t('actions'), key: 'actions', width: 200,
        render: (row) => h(NSpace, null, () => [
            h(NButton, {
                size: 'small', tertiary: true, type: 'warning',
                onClick: () => { resetTargetId.value = row.id; showResetConfirm.value = true; }
            }, () => t('resetUsage')),
            h(NButton, {
                size: 'small', tertiary: true, type: 'error',
                onClick: () => { deleteTargetId.value = row.id; showDeleteConfirm.value = true; }
            }, () => t('delete')),
        ])
    }
]

const fetchData = async () => {
    try {
        const res = await api.fetch(
            `/admin/api_keys?limit=${pageSize.value}&offset=${(page.value - 1) * pageSize.value}`
        );
        data.value = res.results || [];
        if (res.count) count.value = res.count;
    } catch (error) {
        message.error(error.message || "error");
    }
}

const handleCreate = async () => {
    if (!newKeyName.value) return;
    try {
        const res = await api.fetch('/admin/api_keys', {
            method: 'POST',
            body: JSON.stringify({ name: newKeyName.value, max_calls: newKeyMaxCalls.value })
        });
        createdKey.value = res.api_key;
        showCreateModal.value = false;
        showNewKeyModal.value = true;
        newKeyName.value = '';
        newKeyMaxCalls.value = 1000;
        await fetchData();
    } catch (error) {
        message.error(error.message || "error");
    }
}

const handleDelete = async () => {
    try {
        await api.fetch(`/admin/api_keys/${deleteTargetId.value}`, { method: 'DELETE' });
        message.success(t('success'));
        await fetchData();
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        showDeleteConfirm.value = false;
    }
}

const handleReset = async () => {
    try {
        await api.fetch(`/admin/api_keys/${resetTargetId.value}/reset_usage`, { method: 'POST' });
        message.success(t('success'));
        await fetchData();
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        showResetConfirm.value = false;
    }
}

const copyKey = async () => {
    try {
        await navigator.clipboard.writeText(createdKey.value);
        message.success(t('copySuccess'));
    } catch {
        message.error('Copy failed');
    }
}

onMounted(fetchData)
</script>

<template>
    <div class="center">
        <n-card :title="t('title')" :bordered="false" embedded style="max-width: 900px;">
            <template #header-extra>
                <n-button type="primary" @click="showCreateModal = true">
                    {{ t('create') }}
                </n-button>
            </template>
            <n-data-table :columns="columns" :data="data" :loading="loading" :row-key="(row) => row.id" />
            <n-pagination v-model:page="page" :page-size="pageSize" :item-count="count"
                :page-slot="5" @update:page="fetchData" style="margin-top: 10px;"
                :prefix="({ itemCount }) => `${t('itemCount')}: ${itemCount}`" />
        </n-card>

        <!-- Create Modal -->
        <n-modal v-model:show="showCreateModal" preset="dialog" :title="t('create')">
            <n-space vertical>
                <n-input v-model:value="newKeyName" :placeholder="t('keyName')" />
                <n-input-number v-model:value="newKeyMaxCalls" :min="1" :placeholder="t('maxCalls')"
                    style="width: 100%;" />
            </n-space>
            <template #action>
                <n-button type="primary" @click="handleCreate" :loading="loading" :disabled="!newKeyName">
                    {{ t('create') }}
                </n-button>
            </template>
        </n-modal>

        <!-- New Key Display Modal -->
        <n-modal v-model:show="showNewKeyModal" preset="dialog" :title="t('newKeyTitle')">
            <n-alert type="warning" :show-icon="true" style="margin-bottom: 12px;">
                {{ t('newKeyTip') }}
            </n-alert>
            <n-input :value="createdKey" readonly type="textarea" :autosize="{ minRows: 2 }" />
            <template #action>
                <n-button type="primary" @click="copyKey">{{ t('copy') }}</n-button>
            </template>
        </n-modal>

        <!-- Delete Confirm -->
        <n-modal v-model:show="showDeleteConfirm" preset="dialog" :title="t('delete')">
            <p>{{ t('deleteTip') }}</p>
            <template #action>
                <n-button type="error" @click="handleDelete" :loading="loading" size="small" tertiary>
                    {{ t('delete') }}
                </n-button>
            </template>
        </n-modal>

        <!-- Reset Confirm -->
        <n-modal v-model:show="showResetConfirm" preset="dialog" :title="t('resetUsage')">
            <p>{{ t('resetTip') }}</p>
            <template #action>
                <n-button type="warning" @click="handleReset" :loading="loading" size="small" tertiary>
                    {{ t('resetUsage') }}
                </n-button>
            </template>
        </n-modal>
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
