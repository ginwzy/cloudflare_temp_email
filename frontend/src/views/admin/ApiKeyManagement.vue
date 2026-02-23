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
            docTitle: 'API Usage Guide',
            docDesc: 'Use API Key to call the following endpoints programmatically. All requests require the x-api-key header. Each call consumes 1 quota.',
            docAuth: 'Authentication',
            docAuthDesc: 'Add the following header to all requests:',
            docEndpoints: 'Endpoints',
            docCreateAddr: '1. Create Temp Address',
            docListAddr: '2. List Addresses',
            docListMails: '3. List Mails',
            docGetMail: '4. Get Mail Detail',
            docExtract: '5. Get AI Extract Result',
            docNotes: 'Notes',
            docNote1: 'One API key can create and manage multiple addresses',
            docNote2: 'Each API call consumes 1 usage quota regardless of the endpoint',
            docNote3: 'When usage reaches the limit, the API returns HTTP 429',
            docNote4: 'Replace YOUR_DOMAIN with your actual deployment domain',
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
            docTitle: 'API 使用说明',
            docDesc: '使用 API Key 以编程方式调用以下接口。所有请求需携带 x-api-key 请求头，每次调用消耗 1 次配额。',
            docAuth: '认证方式',
            docAuthDesc: '在所有请求中添加以下请求头：',
            docEndpoints: '接口列表',
            docCreateAddr: '1. 创建临时邮箱地址',
            docListAddr: '2. 查看地址列表',
            docListMails: '3. 查询邮件列表',
            docGetMail: '4. 获取邮件详情',
            docExtract: '5. 获取 AI 提取结果',
            docNotes: '注意事项',
            docNote1: '一个 API Key 可以创建和管理多个地址',
            docNote2: '每次 API 调用消耗 1 次配额，不区分接口',
            docNote3: '用量达到上限后，API 将返回 HTTP 429',
            docNote4: '请将 YOUR_DOMAIN 替换为你的实际部署域名',
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
            <!-- API Documentation -->
            <n-collapse style="margin-bottom: 16px;">
                <n-collapse-item :title="t('docTitle')" name="doc">
                    <n-text depth="3" style="display: block; margin-bottom: 12px;">
                        {{ t('docDesc') }}
                    </n-text>

                    <n-h6 prefix="bar">{{ t('docAuth') }}</n-h6>
                    <n-text depth="3">{{ t('docAuthDesc') }}</n-text>
                    <pre class="code-block">x-api-key: sk-xxxxxxxxxxxxx</pre>

                    <n-h6 prefix="bar" style="margin-top: 16px;">{{ t('docEndpoints') }}</n-h6>

                    <n-text strong>{{ t('docCreateAddr') }}</n-text>
                    <pre class="code-block">curl -X POST https://YOUR_DOMAIN/open_api/api/address/create \
  -H "x-api-key: sk-xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","domain":"example.com"}'

# Response: {"address":"test@example.com"}</pre>

                    <n-text strong>{{ t('docListAddr') }}</n-text>
                    <pre class="code-block">curl "https://YOUR_DOMAIN/open_api/api/addresses?limit=20&amp;offset=0" \
  -H "x-api-key: sk-xxx"</pre>

                    <n-text strong>{{ t('docListMails') }}</n-text>
                    <pre class="code-block">curl "https://YOUR_DOMAIN/open_api/api/mails?address=test@example.com&amp;limit=20&amp;offset=0" \
  -H "x-api-key: sk-xxx"</pre>

                    <n-text strong>{{ t('docGetMail') }}</n-text>
                    <pre class="code-block">curl "https://YOUR_DOMAIN/open_api/api/mail/MAIL_ID?address=test@example.com" \
  -H "x-api-key: sk-xxx"</pre>

                    <n-text strong>{{ t('docExtract') }}</n-text>
                    <pre class="code-block">curl "https://YOUR_DOMAIN/open_api/api/address/extract/MAIL_ID?address=test@example.com" \
  -H "x-api-key: sk-xxx"

# Response: {"ai_extract": {...}}</pre>

                    <n-h6 prefix="bar" style="margin-top: 16px;">{{ t('docNotes') }}</n-h6>
                    <ul class="doc-notes">
                        <li>{{ t('docNote1') }}</li>
                        <li>{{ t('docNote2') }}</li>
                        <li>{{ t('docNote3') }}</li>
                        <li>{{ t('docNote4') }}</li>
                    </ul>
                </n-collapse-item>
            </n-collapse>

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
.code-block {
    background: var(--n-color-embedded, #f4f4f8);
    border: 1px solid var(--n-border-color, #e0e0e6);
    border-radius: 6px;
    padding: 10px 14px;
    margin: 6px 0 12px;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 12.5px;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    color: var(--n-text-color, #333);
}
.doc-notes {
    margin: 4px 0 0;
    padding-left: 20px;
    line-height: 2;
    color: var(--n-text-color-3, #999);
    font-size: 13px;
}
</style>
