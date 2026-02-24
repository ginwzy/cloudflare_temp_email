<script setup>
import { ref, h, onMounted, watch, computed } from 'vue';
import { NBadge, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { getRouterPathWithLang } from '../../utils'
import { NButton, NMenu, NTag, NSpace } from 'naive-ui';
import { MenuFilled } from '@vicons/material'

const {
    loading, openSettings,
    adminMailTabAddress, adminSendBoxTabAddress
} = useGlobalState()
const message = useMessage()
const router = useRouter()

const { t, locale } = useI18n({
    messages: {
        en: {
            name: 'Name',
            created_at: 'Created At',
            updated_at: 'Update At',
            mail_count: 'Mail Count',
            send_count: 'Send Count',
            source_meta: 'Source',
            showCredential: 'Show Mail Address Credential',
            addressCredential: 'Mail Address Credential',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login to your email account.',
            delete: 'Delete',
            deleteTip: 'Are you sure to delete this email?',
            deleteAccount: 'Delete Account',
            viewMails: 'View Mails',
            viewSendBox: 'View SendBox',
            itemCount: 'itemCount',
            query: 'Query',
            addressQueryTip: 'Leave blank to query all addresses',
            clearInbox: 'Clear Inbox',
            clearSentItems: 'Clear Sent Items',
            clearInboxTip: 'Are you sure to clear inbox for this email?',
            clearSentItemsTip: 'Are you sure to clear sent items for this email?',
            actions: 'Actions',
            success: 'Success',
            resetPassword: 'Reset Password',
            newPassword: 'New Password',
            passwordResetSuccess: 'Password reset successfully',
            selectAll: 'Select All of This Page',
            unselectAll: 'Unselect All',
            pleaseSelectAddress: 'Please select address',
            selectedItems: 'Selected',
            multiDelete: 'Multi Delete',
            multiDeleteTip: 'Are you sure to delete selected addresses?',
            multiClearInbox: 'Multi Clear Inbox',
            multiClearInboxTip: 'Are you sure to clear inbox for selected addresses?',
            multiClearSentItems: 'Multi Clear Sent Items',
            multiClearSentItemsTip: 'Are you sure to clear sent items for selected addresses?',
            tags: 'Tags',
            filterByTag: 'Filter by Tag',
            filterBySource: 'Filter by Source',
            dateFrom: 'Date From',
            dateTo: 'Date To',
            clearFilters: 'Clear Filters',
            batchAddTags: 'Batch Add Tags',
            batchRemoveTags: 'Batch Remove Tags',
            batchSetTags: 'Batch Set Tags',
            editTags: 'Edit Tags',
            noTags: 'No tags',
            tagStatistics: 'Tag Statistics',
        },
        zh: {
            name: '名称',
            created_at: '创建时间',
            updated_at: '更新时间',
            mail_count: '邮件数量',
            send_count: '发送数量',
            source_meta: '来源',
            showCredential: '查看邮箱地址凭证',
            addressCredential: '邮箱地址凭证',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            delete: '删除',
            deleteTip: '确定要删除这个邮箱吗？',
            deleteAccount: '删除邮箱',
            viewMails: '查看邮件',
            viewSendBox: '查看发件箱',
            itemCount: '总数',
            query: '查询',
            addressQueryTip: '留空查询所有地址',
            clearInbox: '清空收件箱',
            clearSentItems: '清空发件箱',
            clearInboxTip: '确定要清空这个邮箱的收件箱吗？',
            clearSentItemsTip: '确定要清空这个邮箱的发件箱吗？',
            actions: '操作',
            success: '成功',
            resetPassword: '重置密码',
            newPassword: '新密码',
            passwordResetSuccess: '密码重置成功',
            selectAll: '全选本页',
            unselectAll: '取消全选',
            pleaseSelectAddress: '请选择地址',
            selectedItems: '已选择',
            multiDelete: '批量删除',
            multiDeleteTip: '确定要删除选中的邮箱吗？',
            multiClearInbox: '批量清空收件箱',
            multiClearInboxTip: '确定要清空选中邮箱的收件箱吗？',
            multiClearSentItems: '批量清空发件箱',
            multiClearSentItemsTip: '确定要清空选中邮箱的发件箱吗？',
            tags: '标签',
            filterByTag: '按标签筛选',
            filterBySource: '按来源筛选',
            dateFrom: '开始日期',
            dateTo: '结束日期',
            clearFilters: '清除筛选',
            batchAddTags: '批量添加标签',
            batchRemoveTags: '批量移除标签',
            batchSetTags: '批量设置标签',
            editTags: '编辑标签',
            noTags: '无标签',
            tagStatistics: '标签统计',
        }
    }
});

const showEmailCredential = ref(false)
const curEmailCredential = ref("")
const curDeleteAddressId = ref(0);
const curClearInboxAddressId = ref(0);
const curClearSentItemsAddressId = ref(0);
const showResetPassword = ref(false);
const curResetPasswordAddressId = ref(0);
const newPassword = ref('');

// Multi-action mode state
const checkedRowKeys = ref([]);
const showMultiActionModal = ref(false);
const multiActionProgress = ref({ percentage: 0, tip: '0/0' });
const multiActionTitle = ref('');

const selectedCount = computed(() => checkedRowKeys.value.length);
const showMultiActionBar = computed(() => checkedRowKeys.value.length > 0);

const addressQuery = ref("")

// Filter state
const tagFilter = ref(null)
const sourceMetaFilter = ref(null)
const dateFromFilter = ref(null)
const dateToFilter = ref(null)
const availableTags = ref([])
const availableSourceMetas = ref([])
const tagStats = ref([])

// Tag management modal state
const showTagModal = ref(false)
const tagModalAction = ref('add')
const tagModalTags = ref([])

// Single address tag edit
const showEditTagsModal = ref(false)
const editTagsAddressId = ref(0)
const editTagsValue = ref([])

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

// Dynamic table width: base columns ~900px, tags column grows with content
const tableScrollX = computed(() => {
    const baseWidth = 960
    let maxTagsWidth = 60 // minimum for "无标签"
    for (const row of data.value) {
        try {
            const tags = JSON.parse(row.tags || '[]')
            // ~55px per tag (small NTag with short text)
            const w = tags.length * 55 + 16
            if (w > maxTagsWidth) maxTagsWidth = w
        } catch { /* ignore */ }
    }
    return baseWidth + maxTagsWidth
})
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)

const showCredential = async (id) => {
    try {
        curEmailCredential.value = await api.adminShowAddressCredential(id)
        showEmailCredential.value = true
    } catch (error) {
        message.error(error.message || "error");
        showEmailCredential.value = false
        curEmailCredential.value = ""
    }
}

const deleteEmail = async () => {
    try {
        await api.adminDeleteAddress(curDeleteAddressId.value)
        message.success(t("success"));
        await fetchData()
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        showDeleteAccount.value = false
    }
}

const clearInbox = async () => {
    try {
        await api.fetch(`/admin/clear_inbox/${curClearInboxAddressId.value}`, {
            method: 'DELETE'
        });
        message.success(t("success"));
        await fetchData()
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        showClearInbox.value = false
    }
}

const clearSentItems = async () => {
    try {
        await api.fetch(`/admin/clear_sent_items/${curClearSentItemsAddressId.value}`, {
            method: 'DELETE'
        });
        message.success(t("success"));
        await fetchData()
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        showClearSentItems.value = false
    }
}

const resetPassword = async () => {
    try {
        await api.fetch(`/admin/address/${curResetPasswordAddressId.value}/reset_password`, {
            method: 'POST',
            body: JSON.stringify({
                password: newPassword.value
            })
        });
        message.success(t("passwordResetSuccess"));
        newPassword.value = '';
        showResetPassword.value = false;
    } catch (error) {
        message.error(error.message || "error");
    }
}

// Multi-action mode functions
const multiActionSelectAll = () => {
    checkedRowKeys.value = data.value.map(item => item.id);
}

const multiActionUnselectAll = () => {
    checkedRowKeys.value = [];
}

// 通用批量操作函数
const executeBatchOperation = async ({
    shouldSkip = () => false,
    apiCall,
    title,
    operationName = 'operation'
}) => {
    try {
        loading.value = true;
        const selectedAddresses = data.value.filter((item) =>
            checkedRowKeys.value.includes(item.id)
        );

        if (selectedAddresses.length === 0) {
            message.error(t('pleaseSelectAddress'));
            return;
        }

        const failedIds = [];
        const totalCount = selectedAddresses.length;

        multiActionProgress.value = {
            percentage: 0,
            tip: `0/${totalCount}`
        };
        multiActionTitle.value = title;
        showMultiActionModal.value = true;

        for (const [index, address] of selectedAddresses.entries()) {
            try {
                if (!shouldSkip(address)) {
                    await apiCall(address.id);
                }
            } catch (error) {
                console.error(`${operationName} failed for address ${address.id}:`, error);
                failedIds.push(address.id);
            }
            multiActionProgress.value = {
                percentage: Math.floor((index + 1) / totalCount * 100),
                tip: `${index + 1}/${totalCount}`
            };
        }

        await fetchData();
        checkedRowKeys.value = failedIds;
        message.success(t("success"));
    } catch (error) {
        message.error(error.message || "error");
    } finally {
        loading.value = false;
    }
}

const multiActionDeleteAccounts = async () => {
    await executeBatchOperation({
        apiCall: (id) => api.adminDeleteAddress(id),
        title: t('multiDelete') + ' ' + t('success'),
        operationName: 'Delete'
    });
}

const multiActionClearInbox = async () => {
    await executeBatchOperation({
        shouldSkip: (address) => address.mail_count <= 0,
        apiCall: (id) => api.fetch(`/admin/clear_inbox/${id}`, {
            method: 'DELETE'
        }),
        title: t('multiClearInbox') + ' ' + t('success'),
        operationName: 'ClearInbox'
    });
}

const multiActionClearSentItems = async () => {
    await executeBatchOperation({
        shouldSkip: (address) => address.send_count <= 0,
        apiCall: (id) => api.fetch(`/admin/clear_sent_items/${id}`, {
            method: 'DELETE'
        }),
        title: t('multiClearSentItems') + ' ' + t('success'),
        operationName: 'ClearSentItems'
    });
}

const executeBatchTagAction = async () => {
    if (checkedRowKeys.value.length === 0) {
        message.error(t('pleaseSelectAddress'));
        return;
    }
    if (tagModalTags.value.length === 0) {
        return;
    }
    try {
        loading.value = true;
        const res = await api.fetch('/admin/batch_tags', {
            method: 'POST',
            body: JSON.stringify({
                ids: checkedRowKeys.value,
                action: tagModalAction.value,
                tags: tagModalTags.value,
            })
        });
        message.success(`${t('success')} (${res.success}/${res.success + res.failed})`);
        showTagModal.value = false;
        await fetchData();
        await fetchFilterOptions();
    } catch (error) {
        message.error(error.message || 'error');
    } finally {
        loading.value = false;
    }
}

const saveEditTags = async () => {
    try {
        loading.value = true;
        await api.fetch(`/admin/address/${editTagsAddressId.value}/tags`, {
            method: 'POST',
            body: JSON.stringify({ tags: editTagsValue.value })
        });
        message.success(t('success'));
        showEditTagsModal.value = false;
        await fetchData();
        await fetchFilterOptions();
    } catch (error) {
        message.error(error.message || 'error');
    } finally {
        loading.value = false;
    }
}

const fetchFilterOptions = async () => {
    try {
        const res = await api.fetch('/admin/tag_statistics');
        availableTags.value = (res.allTags || []).map(tag => ({ label: tag, value: tag }));
        availableSourceMetas.value = (res.sourceMetas || []).map(s => ({ label: s, value: s }));

        // Merge tag counts with mail counts for statistics display
        const mailCountMap = {};
        for (const item of (res.tagMailCounts || [])) {
            mailCountMap[item.tag] = item.mail_count;
        }
        tagStats.value = (res.tagCounts || []).map(item => ({
            tag: item.tag,
            address_count: item.address_count,
            mail_count: mailCountMap[item.tag] || 0,
        }));
    } catch (error) {
        console.error('Failed to fetch filter options:', error);
    }
}

const fetchData = async () => {
    try {
        addressQuery.value = addressQuery.value.trim()
        let url = `/admin/address`
            + `?limit=${pageSize.value}`
            + `&offset=${(page.value - 1) * pageSize.value}`
        if (addressQuery.value) url += `&query=${addressQuery.value}`
        if (tagFilter.value) url += `&tag=${encodeURIComponent(tagFilter.value)}`
        if (sourceMetaFilter.value) url += `&source_meta=${encodeURIComponent(sourceMetaFilter.value)}`
        if (dateFromFilter.value) url += `&date_from=${dateFromFilter.value}`
        if (dateToFilter.value) url += `&date_to=${dateToFilter.value}`

        const { results, count: addressCount } = await api.fetch(url);
        data.value = results;
        if (addressCount > 0) {
            count.value = addressCount;
        }
    } catch (error) {
        console.error(error);
        message.error(error.message || "error");
    }
}

const columns = [
    {
        type: 'selection',
        width: 40
    },
    {
        title: "ID",
        key: "id",
        width: 60
    },
    {
        title: t('name'),
        key: "name",
        width: 220,
        ellipsis: { tooltip: true }
    },
    {
        title: t('created_at'),
        key: "created_at",
        width: 150
    },
    {
        title: t('updated_at'),
        key: "updated_at",
        width: 150
    },
    {
        title: t('source_meta'),
        key: "source_meta",
        width: 70
    },
    {
        title: t('tags'),
        key: "tags",
        render(row) {
            let tags = [];
            try {
                tags = JSON.parse(row.tags || '[]');
            } catch { tags = []; }
            if (tags.length === 0) {
                return h('span', { style: 'color: #999; font-size: 12px;' }, t('noTags'));
            }
            return h('div', { style: 'display: flex; flex-wrap: nowrap; gap: 4px;' },
                tags.map(tag => h(NTag, {
                    size: 'small',
                    type: 'info',
                    round: true,
                    bordered: false,
                }, () => tag))
            );
        }
    },
    {
        title: t('mail_count'),
        key: "mail_count",
        width: 100,
        render(row) {
            return h(NButton,
                {
                    text: true,
                    onClick: () => {
                        if (row.mail_count > 0) {
                            adminMailTabAddress.value = row.name;
                            router.push(getRouterPathWithLang('/admin/emails', locale.value));
                        }
                    }
                },
                {
                    icon: () => h(NBadge, {
                        value: row.mail_count,
                        'show-zero': true,
                        max: 99,
                        type: "success"
                    }),
                    default: () => row.mail_count > 0 ? t('viewMails') : ""
                }
            )
        }
    },
    {
        title: t('send_count'),
        key: "send_count",
        width: 100,
        render(row) {
            return h(NButton,
                {
                    text: true,
                    onClick: () => {
                        if (row.send_count > 0) {
                            adminSendBoxTabAddress.value = row.name;
                            router.push(getRouterPathWithLang('/admin/emails', locale.value));
                        }
                    }
                },
                {
                    icon: () => h(NBadge, {
                        value: row.send_count,
                        'show-zero': true,
                        max: 99,
                        type: "success"
                    }),
                    default: () => row.send_count > 0 ? t('viewSendBox') : ""
                }
            )
        }
    },
    {
        title: '',
        key: 'actions',
        width: 70,
        render(row) {
            return h('div', [
                h(NMenu, {
                    mode: "horizontal",
                    options: [
                        {
                            label: t('actions'),
                            icon: () => h(MenuFilled),
                            key: "action",
                            children: [
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => showCredential(row.id)
                                        },
                                        { default: () => t('showCredential') }
                                    ),
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                adminMailTabAddress.value = row.name;
                                                router.push(getRouterPathWithLang('/admin/emails', locale.value));
                                            }
                                        },
                                        { default: () => t('viewMails') }
                                    ),
                                    show: row.mail_count > 0
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                adminSendBoxTabAddress.value = row.name;
                                                router.push(getRouterPathWithLang('/admin/emails', locale.value));
                                            }
                                        },
                                        { default: () => t('viewSendBox') }
                                    ),
                                    show: row.send_count > 0
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                curClearInboxAddressId.value = row.id;
                                                showClearInbox.value = true;
                                            }
                                        },
                                        { default: () => t('clearInbox') }
                                    ),
                                    show: row.mail_count > 0
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                curClearSentItemsAddressId.value = row.id;
                                                showClearSentItems.value = true;
                                            }
                                        },
                                        { default: () => t('clearSentItems') }
                                    ),
                                    show: row.send_count > 0
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                curResetPasswordAddressId.value = row.id;
                                                showResetPassword.value = true;
                                            }
                                        },
                                        { default: () => t('resetPassword') }
                                    ),
                                    show: openSettings.value?.enableAddressPassword
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                editTagsAddressId.value = row.id;
                                                try {
                                                    editTagsValue.value = JSON.parse(row.tags || '[]');
                                                } catch { editTagsValue.value = []; }
                                                showEditTagsModal.value = true;
                                            }
                                        },
                                        { default: () => t('editTags') }
                                    ),
                                },
                                {
                                    label: () => h(NButton,
                                        {
                                            text: true,
                                            onClick: () => {
                                                curDeleteAddressId.value = row.id;
                                                showDeleteAccount.value = true;
                                            }
                                        },
                                        { default: () => t('delete') }
                                    )
                                }
                            ]
                        }
                    ]
                })
            ])
        }
    }
]

watch([page, pageSize], async () => {
    await fetchData()
})

onMounted(async () => {
    await fetchFilterOptions()
    await fetchData()
})
</script>

<template>
    <div style="margin-top: 10px;">
        <n-modal v-model:show="showEmailCredential" preset="dialog" title="Dialog">
            <template #header>
                <div>{{ t("addressCredential") }}</div>
            </template>
            <span>
                <p>{{ t("addressCredentialTip") }}</p>
            </span>
            <n-card :bordered="false" embedded>
                <b>{{ curEmailCredential }}</b>
            </n-card>
            <template #action>
            </template>
        </n-modal>
        <n-modal v-model:show="showDeleteAccount" preset="dialog" :title="t('deleteAccount')">
            <p>{{ t('deleteTip') }}</p>
            <template #action>
                <n-button :loading="loading" @click="deleteEmail" size="small" tertiary type="error">
                    {{ t('deleteAccount') }}
                </n-button>
            </template>
        </n-modal>
        <n-modal v-model:show="showClearInbox" preset="dialog" :title="t('clearInbox')">
            <p>{{ t('clearInboxTip') }}</p>
            <template #action>
                <n-button :loading="loading" @click="clearInbox" size="small" tertiary type="error">
                    {{ t('clearInbox') }}
                </n-button>
            </template>
        </n-modal>
        <n-modal v-model:show="showClearSentItems" preset="dialog" :title="t('clearSentItems')">
            <p>{{ t('clearSentItemsTip') }}</p>
            <template #action>
                <n-button :loading="loading" @click="clearSentItems" size="small" tertiary type="error">
                    {{ t('clearSentItems') }}
                </n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showResetPassword" preset="dialog" :title="t('resetPassword')">
            <n-form-item :label="t('newPassword')">
                <n-input v-model:value="newPassword" type="password" placeholder="" show-password-on="click" />
            </n-form-item>
            <template #action>
                <n-button :loading="loading" @click="resetPassword" size="small" tertiary type="info">
                    {{ t('resetPassword') }}
                </n-button>
            </template>
        </n-modal>
        <n-input-group style="margin-bottom: 10px;">
            <n-input v-model:value="addressQuery" clearable :placeholder="t('addressQueryTip')"
                @keydown.enter="fetchData" />
            <n-button @click="fetchData" type="primary" tertiary>
                {{ t('query') }}
            </n-button>
        </n-input-group>

        <!-- Advanced filters -->
        <n-space style="margin-bottom: 10px;" align="center" :wrap="true">
            <n-select v-model:value="tagFilter" :options="availableTags" :placeholder="t('filterByTag')" clearable
                filterable style="width: 180px;" @update:value="fetchData" />
            <n-select v-model:value="sourceMetaFilter" :options="availableSourceMetas"
                :placeholder="t('filterBySource')" clearable style="width: 180px;" @update:value="fetchData" />
            <n-date-picker v-model:formatted-value="dateFromFilter" type="date" :placeholder="t('dateFrom')" clearable
                value-format="yyyy-MM-dd" style="width: 160px;" @update:value="fetchData" />
            <n-date-picker v-model:formatted-value="dateToFilter" type="date" :placeholder="t('dateTo')" clearable
                value-format="yyyy-MM-dd" style="width: 160px;" @update:value="fetchData" />
            <n-button
                @click="() => { tagFilter = null; sourceMetaFilter = null; dateFromFilter = null; dateToFilter = null; fetchData(); }"
                tertiary size="small">
                {{ t('clearFilters') }}
            </n-button>
        </n-space>

        <!-- Tag Statistics -->
        <n-collapse style="margin-bottom: 12px;" v-if="tagStats.length > 0">
            <n-collapse-item :title="t('tagStatistics')" name="tagStats">
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <n-card v-for="stat in tagStats" :key="stat.tag" size="small"
                        style="min-width: 140px; cursor: pointer;"
                        @click="() => { tagFilter = stat.tag; fetchData(); }">
                        <n-statistic :label="stat.tag" :value="stat.address_count">
                            <template #suffix>
                                <n-text depth="3" style="font-size: 12px;">
                                    ({{ stat.mail_count || 0 }} mails)
                                </n-text>
                            </template>
                        </n-statistic>
                    </n-card>
                </div>
            </n-collapse-item>
        </n-collapse>

        <n-space v-if="showMultiActionBar" style="margin-bottom: 10px;">
            <n-button @click="multiActionSelectAll" tertiary>
                {{ t('selectAll') }}
            </n-button>
            <n-button @click="multiActionUnselectAll" tertiary>
                {{ t('unselectAll') }}
            </n-button>
            <n-popconfirm @positive-click="multiActionDeleteAccounts">
                <template #trigger>
                    <n-button tertiary type="error">{{ t('multiDelete') }}</n-button>
                </template>
                {{ t('multiDeleteTip') }}
            </n-popconfirm>
            <n-popconfirm @positive-click="multiActionClearInbox">
                <template #trigger>
                    <n-button tertiary type="warning">{{ t('multiClearInbox') }}</n-button>
                </template>
                {{ t('multiClearInboxTip') }}
            </n-popconfirm>
            <n-popconfirm @positive-click="multiActionClearSentItems">
                <template #trigger>
                    <n-button tertiary type="warning">{{ t('multiClearSentItems') }}</n-button>
                </template>
                {{ t('multiClearSentItemsTip') }}
            </n-popconfirm>
            <n-button tertiary type="info"
                @click="() => { tagModalAction = 'add'; tagModalTags = []; showTagModal = true; }">
                {{ t('batchAddTags') }}
            </n-button>
            <n-button tertiary type="warning"
                @click="() => { tagModalAction = 'remove'; tagModalTags = []; showTagModal = true; }">
                {{ t('batchRemoveTags') }}
            </n-button>
            <n-button tertiary
                @click="() => { tagModalAction = 'set'; tagModalTags = []; showTagModal = true; }">
                {{ t('batchSetTags') }}
            </n-button>
            <n-tag type="info">
                {{ t('selectedItems') }}: {{ selectedCount }}
            </n-tag>
        </n-space>
        <div style="overflow: auto;">
            <div :style="{ minWidth: tableScrollX + 'px' }">
                <n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="count"
                    :page-sizes="[20, 50, 100]" show-size-picker>
                    <template #prefix="{ itemCount }">
                        {{ t('itemCount') }}: {{ itemCount }}
                    </template>
                </n-pagination>
                <n-data-table v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data"
                    :bordered="false" :row-key="row => row.id" embedded />
            </div>
        </div>

        <!-- Multi-action progress modal -->
        <n-modal v-model:show="showMultiActionModal" preset="dialog" :title="multiActionTitle" negative-text="OK">
            <n-space justify="center">
                <n-progress type="circle" status="info" :percentage="multiActionProgress.percentage">
                    <span style="text-align: center">
                        {{ multiActionProgress.tip }}
                    </span>
                </n-progress>
            </n-space>
        </n-modal>

        <!-- Batch tag modal -->
        <n-modal v-model:show="showTagModal" preset="dialog"
            :title="tagModalAction === 'add' ? t('batchAddTags') : tagModalAction === 'remove' ? t('batchRemoveTags') : t('batchSetTags')">
            <n-dynamic-tags v-model:value="tagModalTags" />
            <template #action>
                <n-button type="primary" @click="executeBatchTagAction" :loading="loading" size="small">
                    {{ tagModalAction === 'add' ? t('batchAddTags') : tagModalAction === 'remove' ? t('batchRemoveTags') : t('batchSetTags') }}
                </n-button>
            </template>
        </n-modal>

        <!-- Edit tags for single address -->
        <n-modal v-model:show="showEditTagsModal" preset="dialog" :title="t('editTags')">
            <n-dynamic-tags v-model:value="editTagsValue" />
            <template #action>
                <n-button type="primary" @click="saveEditTags" :loading="loading" size="small">
                    {{ t('success') }}
                </n-button>
            </template>
        </n-modal>

    </div>
</template>

<style scoped>
.n-pagination {
    margin-top: 10px;
    margin-bottom: 10px;
}
</style>
