<script setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { MoreHorizRound } from '@vicons/material'
import { NBadge, NButton, NDropdown, NIcon, NTag, useMessage } from 'naive-ui'

import { api } from '../../api'
import { useGlobalState } from '../../store'
import { getRouterPathWithLang } from '../../utils'
import AccountFiltersPanel from './components/AccountFiltersPanel.vue'
import AccountTablePanel from './components/AccountTablePanel.vue'
import BatchActionBar from './components/BatchActionBar.vue'

const ROUTE_QUERY_KEYS = ['aq', 'tag', 'src', 'from', 'to', 'p', 'ps']
const PAGE_SIZE_OPTIONS = [20, 50, 100]
const COLUMN_STORAGE_KEY = 'admin.accounts.visible_columns.v1'
const DEFAULT_VISIBLE_COLUMN_KEYS = [
  'id',
  'name',
  'created_at',
  'updated_at',
  'source_meta',
  'tags',
  'mail_count',
  'send_count'
]

const {
  loading,
  openSettings,
  adminMailTabAddress,
  adminSendBoxTabAddress
} = useGlobalState()

const message = useMessage()
const route = useRoute()
const router = useRouter()

const { t, locale } = useI18n({
  messages: {
    en: {
      name: 'Name',
      created_at: 'Created At',
      updated_at: 'Updated At',
      mail_count: 'Mail Count',
      send_count: 'Send Count',
      source_meta: 'Source',
      delete: 'Delete',
      deleteTip: 'Are you sure to delete this email?',
      deleteAccount: 'Delete Account',
      viewMails: 'View Mails',
      viewSendBox: 'View Sent',
      itemCount: 'Total',
      query: 'Search',
      addressQueryTip: 'Leave blank to query all addresses',
      clearInbox: 'Clear Inbox',
      clearSentItems: 'Clear Sent',
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
      multiDelete: 'Batch Delete',
      multiDeleteTip: 'Are you sure to delete selected addresses?',
      multiClearInbox: 'Batch Clear Inbox',
      multiClearInboxTip: 'Are you sure to clear inbox for selected addresses?',
      multiClearSentItems: 'Batch Clear Sent',
      multiClearSentItemsTip: 'Are you sure to clear sent items for selected addresses?',
      tags: 'Tags',
      filterByTag: 'Tag',
      filterBySource: 'Source',
      dateFrom: 'Date From',
      dateTo: 'Date To',
      clearFilters: 'Reset Filters',
      batchAddTags: 'Batch Add Tags',
      batchRemoveTags: 'Batch Remove Tags',
      batchSetTags: 'Batch Set Tags',
      editTags: 'Edit Tags',
      noTags: 'No tags',
      tagStatistics: 'Tag Statistics',
      advancedFilters: 'Advanced Filters',
      hideAdvancedFilters: 'Hide Advanced',
      openTagStats: 'View Tag Stats',
      activeFilters: 'Active Filters',
      clearAllActiveFilters: 'Clear all',
      tableSubtitle: 'Manage mailbox accounts, filters, and batch operations efficiently.',
      emptyTagStats: 'No tag statistics',
      actionMore: 'More',
      columns: 'Columns',
      resetColumns: 'Reset columns'
    },
    zh: {
      name: '名称',
      created_at: '创建时间',
      updated_at: '更新时间',
      mail_count: '邮件数量',
      send_count: '发送数量',
      source_meta: '来源',
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
      advancedFilters: '高级筛选',
      hideAdvancedFilters: '收起筛选',
      openTagStats: '查看标签统计',
      activeFilters: '生效筛选',
      clearAllActiveFilters: '清空全部',
      tableSubtitle: '统一管理邮箱账号、筛选条件与批量操作。',
      emptyTagStats: '暂无标签统计',
      actionMore: '更多操作',
      columns: '列显示',
      resetColumns: '重置列'
    }
  }
})

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const addressQuery = ref('')
const tagFilter = ref(null)
const sourceMetaFilter = ref(null)
const dateFromFilter = ref(null)
const dateToFilter = ref(null)

const availableTags = ref([])
const availableSourceMetas = ref([])
const tagStats = ref([])

const showAdvancedFilters = ref(false)
const showTagStatsDrawer = ref(false)

const checkedRowKeys = ref([])
const showMultiActionModal = ref(false)
const multiActionProgress = ref({ percentage: 0, tip: '0/0' })
const multiActionTitle = ref('')

const showTagModal = ref(false)
const tagModalAction = ref('add')
const tagModalTags = ref([])

const showEditTagsModal = ref(false)
const editTagsAddressId = ref(0)
const editTagsValue = ref([])

const curDeleteAddressId = ref(0)
const curClearInboxAddressId = ref(0)
const curClearSentItemsAddressId = ref(0)
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)

const showResetPassword = ref(false)
const curResetPasswordAddressId = ref(0)
const newPassword = ref('')

const visibleColumnKeys = ref([...DEFAULT_VISIBLE_COLUMN_KEYS])

const isInitialized = ref(false)
const isSyncingRoute = ref(false)

const selectedCount = computed(() => checkedRowKeys.value.length)
const showMultiActionBar = computed(() => selectedCount.value > 0)

const labels = computed(() => ({
  query: t('query'),
  tableSubtitle: t('tableSubtitle'),
  openTagStats: t('openTagStats'),
  addressQueryTip: t('addressQueryTip'),
  hideAdvancedFilters: t('hideAdvancedFilters'),
  advancedFilters: t('advancedFilters'),
  clearFilters: t('clearFilters'),
  filterByTag: t('filterByTag'),
  filterBySource: t('filterBySource'),
  dateFrom: t('dateFrom'),
  dateTo: t('dateTo'),
  activeFilters: t('activeFilters'),
  clearAllActiveFilters: t('clearAllActiveFilters'),
  itemCount: t('itemCount'),
  selectedItems: t('selectedItems'),
  columns: t('columns'),
  resetColumns: t('resetColumns'),
  selectAll: t('selectAll'),
  unselectAll: t('unselectAll'),
  multiDelete: t('multiDelete'),
  multiDeleteTip: t('multiDeleteTip'),
  multiClearInbox: t('multiClearInbox'),
  multiClearInboxTip: t('multiClearInboxTip'),
  multiClearSentItems: t('multiClearSentItems'),
  multiClearSentItemsTip: t('multiClearSentItemsTip'),
  batchAddTags: t('batchAddTags'),
  batchRemoveTags: t('batchRemoveTags'),
  batchSetTags: t('batchSetTags')
}))

const tableScrollX = computed(() => {
  const baseWidth = 900
  let maxTagsWidth = 70

  for (const row of data.value) {
    const tags = safeParseTags(row.tags)
    const estimatedWidth = tags.length * 55 + 24
    if (estimatedWidth > maxTagsWidth) maxTagsWidth = estimatedWidth
  }

  return baseWidth + maxTagsWidth
})

const activeFilters = computed(() => {
  const items = []

  if (addressQuery.value.trim()) {
    items.push({
      key: 'query',
      label: `${t('query')}: ${addressQuery.value.trim()}`
    })
  }

  if (tagFilter.value) {
    items.push({
      key: 'tag',
      label: `${t('filterByTag')}: ${tagFilter.value}`
    })
  }

  if (sourceMetaFilter.value) {
    items.push({
      key: 'source',
      label: `${t('filterBySource')}: ${sourceMetaFilter.value}`
    })
  }

  if (dateFromFilter.value) {
    items.push({
      key: 'dateFrom',
      label: `${t('dateFrom')}: ${dateFromFilter.value}`
    })
  }

  if (dateToFilter.value) {
    items.push({
      key: 'dateTo',
      label: `${t('dateTo')}: ${dateToFilter.value}`
    })
  }

  return items
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

const columnOptions = computed(() => [
  { value: 'id', label: 'ID' },
  { value: 'name', label: t('name') },
  { value: 'created_at', label: t('created_at') },
  { value: 'updated_at', label: t('updated_at') },
  { value: 'source_meta', label: t('source_meta') },
  { value: 'tags', label: t('tags') },
  { value: 'mail_count', label: t('mail_count') },
  { value: 'send_count', label: t('send_count') }
])

const columns = computed(() => {
  const columnMap = {
    id: {
      title: 'ID',
      key: 'id',
      width: 70
    },
    name: {
      title: t('name'),
      key: 'name',
      width: 230,
      ellipsis: { tooltip: true }
    },
    created_at: {
      title: t('created_at'),
      key: 'created_at',
      width: 160
    },
    updated_at: {
      title: t('updated_at'),
      key: 'updated_at',
      width: 160
    },
    source_meta: {
      title: t('source_meta'),
      key: 'source_meta',
      width: 90
    },
    tags: {
      title: t('tags'),
      key: 'tags',
      render(row) {
        const tags = safeParseTags(row.tags)
        if (tags.length === 0) {
          return h('span', { class: 'no-tag-text' }, t('noTags'))
        }

        return h(
          'div',
          { class: 'tag-cell' },
          tags.map((tag) =>
            h(
              NTag,
              {
                size: 'small',
                type: 'info',
                round: true,
                bordered: false
              },
              { default: () => tag }
            )
          )
        )
      }
    },
    mail_count: {
      title: t('mail_count'),
      key: 'mail_count',
      width: 130,
      render(row) {
        const canNavigate = row.mail_count > 0
        return h(
          NButton,
          {
            text: true,
            disabled: !canNavigate,
            onClick: () => openMails(row)
          },
          {
            icon: () =>
              h(NBadge, {
                value: row.mail_count,
                'show-zero': true,
                max: 99,
                type: 'success'
              }),
            default: () => (canNavigate ? t('viewMails') : '')
          }
        )
      }
    },
    send_count: {
      title: t('send_count'),
      key: 'send_count',
      width: 130,
      render(row) {
        const canNavigate = row.send_count > 0
        return h(
          NButton,
          {
            text: true,
            disabled: !canNavigate,
            onClick: () => openSent(row)
          },
          {
            icon: () =>
              h(NBadge, {
                value: row.send_count,
                'show-zero': true,
                max: 99,
                type: 'success'
              }),
            default: () => (canNavigate ? t('viewSendBox') : '')
          }
        )
      }
    }
  }

  const mainColumns = visibleColumnKeys.value
    .map((key) => columnMap[key])
    .filter(Boolean)

  return [
    {
      type: 'selection',
      width: 40
    },
    ...mainColumns,
    {
      title: '',
      key: 'actions',
      width: 76,
      render(row) {
        return h(
          NDropdown,
          {
            trigger: 'click',
            options: rowActionOptions(row),
            onSelect: (key) => handleRowAction(key, row)
          },
          {
            default: () =>
              h(
                NButton,
                {
                  quaternary: true,
                  circle: true,
                  size: 'small',
                  'aria-label': t('actionMore')
                },
                {
                  icon: () => h(NIcon, { component: MoreHorizRound })
                }
              )
          }
        )
      }
    }
  ]
})

function safeParseTags(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function queryValue(query, key) {
  const value = query[key]
  return Array.isArray(value) ? value[0] : value
}

function normalizeQueryString(value) {
  if (typeof value !== 'string') return ''
  return value
}

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue
}

function applyRouteQueryState(query) {
  addressQuery.value = normalizeQueryString(queryValue(query, 'aq'))
  tagFilter.value = normalizeQueryString(queryValue(query, 'tag')) || null
  sourceMetaFilter.value = normalizeQueryString(queryValue(query, 'src')) || null
  dateFromFilter.value = normalizeQueryString(queryValue(query, 'from')) || null
  dateToFilter.value = normalizeQueryString(queryValue(query, 'to')) || null

  page.value = parsePositiveInteger(queryValue(query, 'p'), 1)

  const parsedPageSize = parsePositiveInteger(queryValue(query, 'ps'), 20)
  pageSize.value = PAGE_SIZE_OPTIONS.includes(parsedPageSize) ? parsedPageSize : 20

  showAdvancedFilters.value = !!(tagFilter.value || sourceMetaFilter.value || dateFromFilter.value || dateToFilter.value)
}

function buildManagedRouteQuery() {
  const nextQuery = {}
  const trimmedQuery = addressQuery.value.trim()

  if (trimmedQuery) nextQuery.aq = trimmedQuery
  if (tagFilter.value) nextQuery.tag = tagFilter.value
  if (sourceMetaFilter.value) nextQuery.src = sourceMetaFilter.value
  if (dateFromFilter.value) nextQuery.from = dateFromFilter.value
  if (dateToFilter.value) nextQuery.to = dateToFilter.value
  if (page.value !== 1) nextQuery.p = String(page.value)
  if (pageSize.value !== 20) nextQuery.ps = String(pageSize.value)

  return nextQuery
}

function normalizeRouteQueryObject(query) {
  const normalized = {}

  for (const key of Object.keys(query).sort()) {
    const value = query[key]
    if (value === undefined || value === null || value === '') continue
    normalized[key] = Array.isArray(value) ? value.join(',') : String(value)
  }

  return JSON.stringify(normalized)
}

async function syncRouteQuery() {
  const mergedQuery = { ...route.query }

  for (const key of ROUTE_QUERY_KEYS) {
    delete mergedQuery[key]
  }

  Object.assign(mergedQuery, buildManagedRouteQuery())

  if (normalizeRouteQueryObject(route.query) === normalizeRouteQueryObject(mergedQuery)) {
    return
  }

  isSyncingRoute.value = true
  await router.replace({ path: route.path, query: mergedQuery })
}

function loadVisibleColumnsFromStorage() {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return

    const validKeys = parsed.filter((key) => DEFAULT_VISIBLE_COLUMN_KEYS.includes(key))
    if (validKeys.length > 0) {
      visibleColumnKeys.value = validKeys
    }
  } catch (error) {
    console.error('Failed to load column settings:', error)
  }
}

function saveVisibleColumnsToStorage() {
  try {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnKeys.value))
  } catch (error) {
    console.error('Failed to save column settings:', error)
  }
}

function updateVisibleColumnKeys(nextKeys) {
  const normalizedKeys = DEFAULT_VISIBLE_COLUMN_KEYS.filter((key) => nextKeys.includes(key))
  visibleColumnKeys.value = normalizedKeys.length > 0 ? normalizedKeys : ['name']
  saveVisibleColumnsToStorage()
}

function resetVisibleColumns() {
  visibleColumnKeys.value = [...DEFAULT_VISIBLE_COLUMN_KEYS]
  saveVisibleColumnsToStorage()
}

function rowActionOptions(row) {
  const options = []

  if (row.mail_count > 0) {
    options.push({ label: t('viewMails'), key: 'view-mails' })
    options.push({ label: t('clearInbox'), key: 'clear-inbox' })
  }

  if (row.send_count > 0) {
    options.push({ label: t('viewSendBox'), key: 'view-sent' })
    options.push({ label: t('clearSentItems'), key: 'clear-sent' })
  }

  if (openSettings.value?.enableAddressPassword) {
    options.push({ label: t('resetPassword'), key: 'reset-password' })
  }

  if (options.length > 0) {
    options.push({ type: 'divider', key: 'divider-1' })
  }

  options.push({ label: t('editTags'), key: 'edit-tags' })
  options.push({ label: t('delete'), key: 'delete' })

  return options
}

function handleRowAction(actionKey, row) {
  switch (actionKey) {
    case 'view-mails':
      openMails(row)
      break
    case 'view-sent':
      openSent(row)
      break
    case 'clear-inbox':
      curClearInboxAddressId.value = row.id
      showClearInbox.value = true
      break
    case 'clear-sent':
      curClearSentItemsAddressId.value = row.id
      showClearSentItems.value = true
      break
    case 'reset-password':
      curResetPasswordAddressId.value = row.id
      showResetPassword.value = true
      break
    case 'edit-tags':
      editTagsAddressId.value = row.id
      editTagsValue.value = safeParseTags(row.tags)
      showEditTagsModal.value = true
      break
    case 'delete':
      curDeleteAddressId.value = row.id
      showDeleteAccount.value = true
      break
    default:
      break
  }
}

function openMails(row) {
  if (row.mail_count <= 0) return
  adminMailTabAddress.value = row.name
  router.push(getRouterPathWithLang('/admin/emails', locale.value))
}

function openSent(row) {
  if (row.send_count <= 0) return
  adminSendBoxTabAddress.value = row.name
  router.push(getRouterPathWithLang('/admin/emails', locale.value))
}

async function fetchFilterOptions() {
  try {
    const res = await api.fetch('/admin/tag_statistics')

    availableTags.value = (res.allTags || []).map((tag) => ({ label: tag, value: tag }))
    availableSourceMetas.value = (res.sourceMetas || []).map((source) => ({ label: source, value: source }))

    const mailCountMap = {}
    for (const item of res.tagMailCounts || []) {
      mailCountMap[item.tag] = item.mail_count
    }

    tagStats.value = (res.tagCounts || []).map((item) => ({
      tag: item.tag,
      address_count: item.address_count,
      mail_count: mailCountMap[item.tag] || 0
    }))
  } catch (error) {
    console.error('Failed to fetch filter options:', error)
  }
}

async function fetchData() {
  try {
    const query = addressQuery.value.trim()

    let url = `/admin/address?limit=${pageSize.value}&offset=${(page.value - 1) * pageSize.value}`
    if (query) url += `&query=${encodeURIComponent(query)}`
    if (tagFilter.value) url += `&tag=${encodeURIComponent(tagFilter.value)}`
    if (sourceMetaFilter.value) url += `&source_meta=${encodeURIComponent(sourceMetaFilter.value)}`
    if (dateFromFilter.value) url += `&date_from=${dateFromFilter.value}`
    if (dateToFilter.value) url += `&date_to=${dateToFilter.value}`

    const { results, count: addressCount } = await api.fetch(url)
    data.value = results || []
    count.value = Number(addressCount) || 0
  } catch (error) {
    console.error(error)
    message.error(error.message || 'error')
  }
}

async function refreshList({ resetPage = false } = {}) {
  if (resetPage) page.value = 1
  await syncRouteQuery()
  await fetchData()
}

function handlePageChange(nextPage) {
  page.value = nextPage
  refreshList()
}

function handlePageSizeChange(nextPageSize) {
  pageSize.value = nextPageSize
  page.value = 1
  refreshList()
}

function clearFilterByKey(filterKey) {
  if (filterKey === 'query') addressQuery.value = ''
  if (filterKey === 'tag') tagFilter.value = null
  if (filterKey === 'source') sourceMetaFilter.value = null
  if (filterKey === 'dateFrom') dateFromFilter.value = null
  if (filterKey === 'dateTo') dateToFilter.value = null
  refreshList({ resetPage: true })
}

function clearAllFilters() {
  addressQuery.value = ''
  tagFilter.value = null
  sourceMetaFilter.value = null
  dateFromFilter.value = null
  dateToFilter.value = null
  refreshList({ resetPage: true })
}

function openBatchTagModal(action) {
  tagModalAction.value = action
  tagModalTags.value = []
  showTagModal.value = true
}

function multiActionSelectAll() {
  checkedRowKeys.value = data.value.map((item) => item.id)
}

function multiActionUnselectAll() {
  checkedRowKeys.value = []
}

async function executeBatchOperation({
  shouldSkip = () => false,
  apiCall,
  title,
  operationName = 'operation'
}) {
  try {
    loading.value = true

    const selectedAddresses = data.value.filter((item) => checkedRowKeys.value.includes(item.id))
    if (selectedAddresses.length === 0) {
      message.error(t('pleaseSelectAddress'))
      return
    }

    const failedIds = []
    const totalCount = selectedAddresses.length

    multiActionProgress.value = {
      percentage: 0,
      tip: `0/${totalCount}`
    }

    multiActionTitle.value = title
    showMultiActionModal.value = true

    for (const [index, address] of selectedAddresses.entries()) {
      try {
        if (!shouldSkip(address)) {
          await apiCall(address.id)
        }
      } catch (error) {
        console.error(`${operationName} failed for address ${address.id}:`, error)
        failedIds.push(address.id)
      }

      multiActionProgress.value = {
        percentage: Math.floor(((index + 1) / totalCount) * 100),
        tip: `${index + 1}/${totalCount}`
      }
    }

    await fetchData()
    checkedRowKeys.value = failedIds
    message.success(t('success'))
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

async function multiActionDeleteAccounts() {
  await executeBatchOperation({
    apiCall: (id) => api.adminDeleteAddress(id),
    title: `${t('multiDelete')} ${t('success')}`,
    operationName: 'Delete'
  })
}

async function multiActionClearInbox() {
  await executeBatchOperation({
    shouldSkip: (address) => address.mail_count <= 0,
    apiCall: (id) => api.fetch(`/admin/clear_inbox/${id}`, { method: 'DELETE' }),
    title: `${t('multiClearInbox')} ${t('success')}`,
    operationName: 'ClearInbox'
  })
}

async function multiActionClearSentItems() {
  await executeBatchOperation({
    shouldSkip: (address) => address.send_count <= 0,
    apiCall: (id) => api.fetch(`/admin/clear_sent_items/${id}`, { method: 'DELETE' }),
    title: `${t('multiClearSentItems')} ${t('success')}`,
    operationName: 'ClearSentItems'
  })
}

async function executeBatchTagAction() {
  if (checkedRowKeys.value.length === 0) {
    message.error(t('pleaseSelectAddress'))
    return
  }

  if (tagModalTags.value.length === 0) return

  try {
    loading.value = true

    const res = await api.fetch('/admin/batch_tags', {
      method: 'POST',
      body: JSON.stringify({
        ids: checkedRowKeys.value,
        action: tagModalAction.value,
        tags: tagModalTags.value
      })
    })

    message.success(`${t('success')} (${res.success}/${res.success + res.failed})`)
    showTagModal.value = false

    await fetchData()
    await fetchFilterOptions()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

async function saveEditTags() {
  try {
    loading.value = true

    await api.fetch(`/admin/address/${editTagsAddressId.value}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags: editTagsValue.value })
    })

    message.success(t('success'))
    showEditTagsModal.value = false

    await fetchData()
    await fetchFilterOptions()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

async function deleteEmail() {
  try {
    await api.adminDeleteAddress(curDeleteAddressId.value)
    message.success(t('success'))
    await fetchData()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showDeleteAccount.value = false
  }
}

async function clearInbox() {
  try {
    await api.fetch(`/admin/clear_inbox/${curClearInboxAddressId.value}`, {
      method: 'DELETE'
    })

    message.success(t('success'))
    await fetchData()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearInbox.value = false
  }
}

async function clearSentItems() {
  try {
    await api.fetch(`/admin/clear_sent_items/${curClearSentItemsAddressId.value}`, {
      method: 'DELETE'
    })

    message.success(t('success'))
    await fetchData()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearSentItems.value = false
  }
}

async function resetPassword() {
  try {
    await api.fetch(`/admin/address/${curResetPasswordAddressId.value}/reset_password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword.value })
    })

    message.success(t('passwordResetSuccess'))
    newPassword.value = ''
    showResetPassword.value = false
  } catch (error) {
    message.error(error.message || 'error')
  }
}

function applyTagStatFilter(tag) {
  tagFilter.value = tag
  showTagStatsDrawer.value = false
  refreshList({ resetPage: true })
}

watch(
  () => route.query,
  async (nextQuery) => {
    if (!isInitialized.value) return

    if (isSyncingRoute.value) {
      isSyncingRoute.value = false
      return
    }

    applyRouteQueryState(nextQuery)
    await fetchData()
  }
)

onMounted(async () => {
  loadVisibleColumnsFromStorage()
  applyRouteQueryState(route.query)

  await fetchFilterOptions()
  await fetchData()

  isInitialized.value = true
})
</script>

<template>
  <section class="account-panel">
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
        <n-input v-model:value="newPassword" type="password" show-password-on="click" />
      </n-form-item>
      <template #action>
        <n-button :loading="loading" @click="resetPassword" size="small" tertiary type="info">
          {{ t('resetPassword') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showMultiActionModal" preset="dialog" :title="multiActionTitle" negative-text="OK">
      <n-space justify="center">
        <n-progress type="circle" status="info" :percentage="multiActionProgress.percentage">
          <span class="progress-text">{{ multiActionProgress.tip }}</span>
        </n-progress>
      </n-space>
    </n-modal>

    <n-modal
      v-model:show="showTagModal"
      preset="dialog"
      :title="tagModalAction === 'add' ? t('batchAddTags') : tagModalAction === 'remove' ? t('batchRemoveTags') : t('batchSetTags')"
    >
      <n-dynamic-tags v-model:value="tagModalTags" />
      <template #action>
        <n-button type="primary" @click="executeBatchTagAction" :loading="loading" size="small">
          {{ tagModalAction === 'add' ? t('batchAddTags') : tagModalAction === 'remove' ? t('batchRemoveTags') : t('batchSetTags') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showEditTagsModal" preset="dialog" :title="t('editTags')">
      <n-dynamic-tags v-model:value="editTagsValue" />
      <template #action>
        <n-button type="primary" @click="saveEditTags" :loading="loading" size="small">
          {{ t('success') }}
        </n-button>
      </template>
    </n-modal>

    <n-drawer v-model:show="showTagStatsDrawer" placement="right" :width="380">
      <n-drawer-content :title="t('tagStatistics')" closable>
        <div v-if="tagStats.length" class="tag-stat-grid">
          <n-card
            v-for="stat in tagStats"
            :key="stat.tag"
            size="small"
            class="tag-stat-card"
            @click="applyTagStatFilter(stat.tag)"
          >
            <n-statistic :label="stat.tag" :value="stat.address_count">
              <template #suffix>
                <n-text depth="3" class="tag-mail-count">({{ stat.mail_count || 0 }} mails)</n-text>
              </template>
            </n-statistic>
          </n-card>
        </div>
        <n-empty v-else :description="t('emptyTagStats')" />
      </n-drawer-content>
    </n-drawer>

    <AccountFiltersPanel
      :labels="labels"
      :address-query="addressQuery"
      :tag-filter="tagFilter"
      :source-meta-filter="sourceMetaFilter"
      :date-from-filter="dateFromFilter"
      :date-to-filter="dateToFilter"
      :available-tags="availableTags"
      :available-source-metas="availableSourceMetas"
      :show-advanced-filters="showAdvancedFilters"
      :has-active-filters="hasActiveFilters"
      :active-filters="activeFilters"
      @update:address-query="addressQuery = $event"
      @update:tag-filter="tagFilter = $event"
      @update:source-meta-filter="sourceMetaFilter = $event"
      @update:date-from-filter="dateFromFilter = $event"
      @update:date-to-filter="dateToFilter = $event"
      @search="refreshList({ resetPage: true })"
      @toggle-advanced="showAdvancedFilters = !showAdvancedFilters"
      @apply-filters="refreshList({ resetPage: true })"
      @clear-all="clearAllFilters"
      @open-tag-stats="showTagStatsDrawer = true"
      @remove-filter="clearFilterByKey"
    />

    <AccountTablePanel
      :labels="labels"
      :count="count"
      :selected-count="selectedCount"
      :show-multi-action-bar="showMultiActionBar"
      :table-scroll-x="tableScrollX"
      :columns="columns"
      :data="data"
      :checked-row-keys="checkedRowKeys"
      :page="page"
      :page-size="pageSize"
      :visible-column-keys="visibleColumnKeys"
      :column-options="columnOptions"
      @update:checked-row-keys="checkedRowKeys = $event"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @update:visible-column-keys="updateVisibleColumnKeys"
      @reset-columns="resetVisibleColumns"
    />

    <BatchActionBar
      v-if="showMultiActionBar"
      :labels="labels"
      :selected-count="selectedCount"
      @select-all="multiActionSelectAll"
      @unselect-all="multiActionUnselectAll"
      @batch-delete="multiActionDeleteAccounts"
      @batch-clear-inbox="multiActionClearInbox"
      @batch-clear-sent="multiActionClearSentItems"
      @batch-tag-add="openBatchTagModal('add')"
      @batch-tag-remove="openBatchTagModal('remove')"
      @batch-tag-set="openBatchTagModal('set')"
    />
  </section>
</template>

<style scoped>
.account-panel {
  display: grid;
  gap: 14px;
  padding-top: 6px;
}

.no-tag-text {
  color: var(--ds-text-secondary);
  font-size: 12px;
}

.tag-cell {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
}

.progress-text {
  text-align: center;
  font-size: 12px;
}

.tag-stat-grid {
  display: grid;
  gap: 10px;
}

.tag-stat-card {
  cursor: pointer;
  transition: transform var(--ds-transition), border-color var(--ds-transition);
}

.tag-stat-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ds-primary) 35%, var(--ds-border));
}

.tag-mail-count {
  font-size: 12px;
}
</style>
