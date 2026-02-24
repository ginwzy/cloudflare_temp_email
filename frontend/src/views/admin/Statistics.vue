<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  PersonOutlineRound, TrendingUpRound, PeopleRound,
  EmailRound, SendRound,
  ManageAccountsRound, SecurityRound, ForwardToInboxRound,
} from '@vicons/material'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { api } from '../../api'
import { getRouterPathWithLang } from '../../utils'
import { useGlobalState } from '../../store'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const message = useMessage()
const router = useRouter()
const { isDark } = useGlobalState()

const { t, locale } = useI18n({
  messages: {
    en: {
      addressCount: 'Total Addresses',
      active7d: '7-Day Active',
      active30d: '30-Day Active',
      userCount: 'Total Users',
      mailCount: 'Received',
      sendMailCount: 'Sent',
      createAddress: 'Addresses',
      sendMail: 'Send Mail',
      manageUsers: 'Users',
      security: 'Security',
      recentEmails: 'Recent Emails',
      systemInfo: 'System',
      noEmails: 'No emails yet',
      noEmailsTip: 'Incoming emails will appear here',
      dbVersion: 'DB Version',
      codeVersion: 'Code Version',
      migration: 'Migration',
      needed: 'Needed',
      upToDate: 'Current',
      version: 'App Version',
      domains: 'Domains',
      s3: 'S3 Storage',
      webhook: 'Webhook',
      enabled: 'On',
      disabled: 'Off',
      justNow: 'just now',
      minutesAgo: '{n}m ago',
      hoursAgo: '{n}h ago',
      daysAgo: '{n}d ago',
      mailActivity: '7-Day Mail Activity',
      received: 'Received',
      sent: 'Sent',
      addressActivity: 'Address Activity',
      active: 'Active',
      inactive: 'Inactive',
    },
    zh: {
      addressCount: '地址总数',
      active7d: '7 天活跃',
      active30d: '30 天活跃',
      userCount: '用户总数',
      mailCount: '已接收',
      sendMailCount: '已发送',
      createAddress: '地址管理',
      sendMail: '发送邮件',
      manageUsers: '用户管理',
      security: '安全设置',
      recentEmails: '最近邮件',
      systemInfo: '系统',
      noEmails: '暂无邮件',
      noEmailsTip: '收到的邮件将显示在这里',
      dbVersion: '数据库版本',
      codeVersion: '代码版本',
      migration: '迁移状态',
      needed: '需要迁移',
      upToDate: '已是最新',
      version: '应用版本',
      domains: '域名数',
      s3: 'S3 存储',
      webhook: 'Webhook',
      enabled: '开启',
      disabled: '关闭',
      justNow: '刚刚',
      minutesAgo: '{n}分钟前',
      hoursAgo: '{n}小时前',
      daysAgo: '{n}天前',
      mailActivity: '7 天邮件趋势',
      received: '接收',
      sent: '发送',
      addressActivity: '地址活跃度',
      active: '活跃',
      inactive: '不活跃',
    }
  }
})
const stats = ref({
  addressCount: 0, activeAddressCount7days: 0, activeAddressCount30days: 0,
  userCount: 0, mailCount: 0, sendMailCount: 0,
})
const recentMails = ref([])
const dbInfo = ref(null)
const workerConfig = ref(null)
const dailyData = ref([])
const loading = ref(true)

const chartTextColor = computed(() => isDark.value ? '#94A3B8' : '#64748B')
const chartBorderColor = computed(() => isDark.value ? '#334155' : '#E2E8F0')

const barChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? '#1E293B' : '#fff',
    borderColor: chartBorderColor.value,
    textStyle: { color: isDark.value ? '#F1F5F9' : '#1E293B', fontSize: 12 },
  },
  legend: {
    data: [t('received'), t('sent')],
    bottom: 0,
    textStyle: { color: chartTextColor.value, fontSize: 11 },
    itemWidth: 12, itemHeight: 8, itemGap: 16,
  },
  grid: { top: 12, right: 12, bottom: 40, left: 36, containLabel: false },
  xAxis: {
    type: 'category',
    data: dailyData.value.map(d => d.date),
    axisLine: { lineStyle: { color: chartBorderColor.value } },
    axisLabel: { color: chartTextColor.value, fontSize: 11 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLine: { show: false },
    axisLabel: { color: chartTextColor.value, fontSize: 11 },
    splitLine: { lineStyle: { color: chartBorderColor.value, type: 'dashed' } },
  },
  series: [
    {
      name: t('received'),
      type: 'bar',
      data: dailyData.value.map(d => d.received),
      itemStyle: { color: '#3B82F6', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 20,
    },
    {
      name: t('sent'),
      type: 'bar',
      data: dailyData.value.map(d => d.sent),
      itemStyle: { color: '#10B981', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 20,
    },
  ],
}))

const donutChartOption = computed(() => {
  const total = stats.value.addressCount || 1
  const active = stats.value.activeAddressCount7days || 0
  const inactive = total - active
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark.value ? '#1E293B' : '#fff',
      borderColor: chartBorderColor.value,
      textStyle: { color: isDark.value ? '#F1F5F9' : '#1E293B', fontSize: 12 },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { color: chartTextColor.value, fontSize: 11 },
      itemWidth: 12, itemHeight: 8, itemGap: 16,
    },
    series: [{
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      label: {
        show: true, position: 'center',
        formatter: `${active}/${total}`,
        fontSize: 16, fontWeight: 700,
        color: isDark.value ? '#F1F5F9' : '#1E293B',
      },
      emphasis: { label: { show: true, fontSize: 18 } },
      itemStyle: { borderRadius: 4, borderColor: isDark.value ? '#1E293B' : '#fff', borderWidth: 2 },
      data: [
        { value: active, name: t('active'), itemStyle: { color: '#3B82F6' } },
        { value: inactive, name: t('inactive'), itemStyle: { color: isDark.value ? '#334155' : '#E2E8F0' } },
      ],
    }],
  }
})

const statCards = [
  { key: 'addressCount', label: 'addressCount', icon: PersonOutlineRound, tone: 'blue' },
  { key: 'activeAddressCount7days', label: 'active7d', icon: TrendingUpRound, tone: 'green' },
  { key: 'activeAddressCount30days', label: 'active30d', icon: TrendingUpRound, tone: 'green' },
  { key: 'userCount', label: 'userCount', icon: PeopleRound, tone: 'blue' },
  { key: 'mailCount', label: 'mailCount', icon: EmailRound, tone: 'blue' },
  { key: 'sendMailCount', label: 'sendMailCount', icon: SendRound, tone: 'blue' },
]

const quickActions = [
  { label: 'createAddress', icon: ManageAccountsRound, path: '/admin/accounts' },
  { label: 'sendMail', icon: ForwardToInboxRound, path: '/admin/emails' },
  { label: 'manageUsers', icon: PeopleRound, path: '/admin/users' },
  { label: 'security', icon: SecurityRound, path: '/admin/security' },
]

const navigate = (path) => router.push(getRouterPathWithLang(path, locale.value))

const relativeTime = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  // Normalize "2025-02-20 12:34:56" → "2025-02-20T12:34:56Z"
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z'
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return ''
  const diff = Math.floor((now - date.getTime()) / 1000)
  if (diff < 60) return t('justNow')
  if (diff < 3600) return t('minutesAgo', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('hoursAgo', { n: Math.floor(diff / 3600) })
  return t('daysAgo', { n: Math.floor(diff / 86400) })
}

const parseSubject = (mail) => {
  try {
    if (mail.raw) {
      const raw = JSON.parse(mail.raw)
      const subjectHeader = raw?.headers?.subject
      if (subjectHeader) return subjectHeader
    }
  } catch {}
  return mail.subject || mail.address || '-'
}

onMounted(async () => {
  try {
    const [statsData, mailsData, db, config, daily] = await Promise.all([
      api.fetch('/admin/statistics'),
      api.fetch('/admin/mails?limit=5&offset=0').catch(() => null),
      api.fetch('/admin/db_version').catch(() => null),
      api.fetch('/admin/worker/configs').catch(() => null),
      api.fetch('/admin/statistics/daily').catch(() => []),
    ])
    Object.assign(stats.value, statsData)
    recentMails.value = mailsData?.results || []
    dbInfo.value = db
    workerConfig.value = config
    dailyData.value = daily || []
  } catch (e) {
    message.error(e.message || 'error')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div v-for="card in statCards" :key="card.key" class="stat-card">
        <div class="stat-icon" :class="'tone-' + card.tone">
          <n-icon :component="card.icon" :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stats[card.key]?.toLocaleString() }}</span>
          <span class="stat-label">{{ t(card.label) }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions-row">
      <button v-for="action in quickActions" :key="action.label"
        class="action-chip" @click="navigate(action.path)">
        <span class="action-icon-wrap">
          <n-icon :component="action.icon" :size="15" />
        </span>
        <span>{{ t(action.label) }}</span>
      </button>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">{{ t('mailActivity') }}</span>
        </div>
        <div v-if="loading" class="panel-loading"><n-spin size="small" /></div>
        <div v-else class="chart-wrap">
          <v-chart :option="barChartOption" autoresize />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">{{ t('addressActivity') }}</span>
        </div>
        <div v-if="loading" class="panel-loading"><n-spin size="small" /></div>
        <div v-else class="chart-wrap">
          <v-chart :option="donutChartOption" autoresize />
        </div>
      </div>
    </div>

    <!-- Bottom panels -->
    <div class="bottom-grid">
      <!-- Recent Emails -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">{{ t('recentEmails') }}</span>
          <span class="panel-count" v-if="recentMails.length">{{ recentMails.length }}</span>
        </div>
        <div v-if="loading" class="panel-loading"><n-spin size="small" /></div>
        <div v-else-if="!recentMails.length" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2" opacity="0.25"/>
            <path d="M8 24l24 14 24-14" stroke="currentColor" stroke-width="2" opacity="0.35"/>
            <circle cx="50" cy="18" r="8" fill="currentColor" opacity="0.1"/>
          </svg>
          <span class="empty-text">{{ t('noEmails') }}</span>
          <span class="empty-hint">{{ t('noEmailsTip') }}</span>
        </div>
        <div v-else class="mail-list">
          <div v-for="mail in recentMails" :key="mail.id" class="mail-row" @click="navigate('/admin/emails')">
            <div class="mail-dot"></div>
            <div class="mail-info">
              <span class="mail-subject">{{ parseSubject(mail) }}</span>
              <span class="mail-meta">{{ mail.source || mail.address || '-' }}</span>
            </div>
            <span class="mail-time">{{ relativeTime(mail.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">{{ t('systemInfo') }}</span>
        </div>
        <div v-if="loading" class="panel-loading"><n-spin size="small" /></div>
        <div v-else class="info-list">
          <template v-if="dbInfo">
            <div class="info-row">
              <span class="info-key">{{ t('dbVersion') }}</span>
              <span class="info-val mono">{{ dbInfo.current_db_version || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ t('codeVersion') }}</span>
              <span class="info-val mono">{{ dbInfo.code_db_version || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ t('migration') }}</span>
              <span class="info-badge" :class="dbInfo.need_migration ? 'warn' : 'ok'">
                {{ dbInfo.need_migration ? t('needed') : t('upToDate') }}
              </span>
            </div>
          </template>
          <template v-if="workerConfig">
            <div class="info-row" v-if="workerConfig.VERSION">
              <span class="info-key">{{ t('version') }}</span>
              <span class="info-val mono">{{ workerConfig.VERSION }}</span>
            </div>
            <div class="info-row" v-if="workerConfig.DOMAINS">
              <span class="info-key">{{ t('domains') }}</span>
              <span class="info-val">{{ workerConfig.DOMAINS.length }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ t('s3') }}</span>
              <span class="info-badge" :class="workerConfig.S3_ENABLED ? 'ok' : 'off'">
                {{ workerConfig.S3_ENABLED ? t('enabled') : t('disabled') }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ t('webhook') }}</span>
              <span class="info-badge" :class="workerConfig.ENABLE_WEBHOOK ? 'ok' : 'off'">
                {{ workerConfig.ENABLE_WEBHOOK ? t('enabled') : t('disabled') }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--ds-surface);
  border-radius: var(--ds-radius);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}
.stat-icon.tone-blue {
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
}
.stat-icon.tone-green {
  background: color-mix(in srgb, #10B981 10%, transparent);
  color: #10B981;
}
.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--ds-text);
  line-height: 1.2;
  letter-spacing: -0.5px;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ds-text-secondary);
  line-height: 1.4;
  margin-top: 2px;
}

/* ── Quick Actions ── */
.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.action-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px 7px 10px;
  border: none;
  border-radius: 8px;
  background: var(--ds-surface);
  color: var(--ds-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.15s ease;
}
.action-chip:hover {
  color: var(--ds-primary);
  background: color-mix(in srgb, var(--ds-primary) 6%, var(--ds-surface));
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.action-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--ds-primary) 8%, transparent);
  color: var(--ds-primary);
  transition: background 0.15s ease;
}
.action-chip:hover .action-icon-wrap {
  background: color-mix(in srgb, var(--ds-primary) 14%, transparent);
}

/* ── Charts Grid ── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.chart-wrap {
  height: 240px;
  padding: 12px 12px 8px;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* ── Panel ── */
.panel {
  background: var(--ds-surface);
  border-radius: var(--ds-radius);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02);
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text);
  letter-spacing: 0.2px;
}
.panel-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-text-secondary);
  background: color-mix(in srgb, var(--ds-text-secondary) 8%, transparent);
  padding: 2px 8px;
  border-radius: 10px;
}
.panel-loading {
  padding: 40px;
  text-align: center;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 20px;
  gap: 6px;
}
.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--ds-text-secondary);
  margin-bottom: 4px;
}
.empty-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--ds-text-secondary);
}
.empty-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--ds-text-secondary) 70%, transparent);
}
/* ── Mail List ── */
.mail-list {
  display: flex;
  flex-direction: column;
}
.mail-row {
  display: flex;
  align-items: center;
  padding: 11px 18px;
  cursor: pointer;
  transition: background 0.12s ease;
  gap: 12px;
}
.mail-row:hover {
  background: color-mix(in srgb, var(--ds-primary) 3%, transparent);
}
.mail-row + .mail-row {
  border-top: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
}
.mail-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ds-primary);
  opacity: 0.5;
  flex-shrink: 0;
}
.mail-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 1px;
}
.mail-subject {
  font-size: 13px;
  font-weight: 500;
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mail-meta {
  font-size: 11px;
  color: var(--ds-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mail-time {
  font-size: 11px;
  color: var(--ds-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  opacity: 0.8;
}

/* ── Info List ── */
.info-list {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
}
.info-key {
  font-size: 13px;
  color: var(--ds-text-secondary);
}
.info-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text);
}
.info-val.mono {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  letter-spacing: 0.3px;
}
.info-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.2px;
}
.info-badge.ok {
  color: #059669;
  background: color-mix(in srgb, #10B981 10%, transparent);
}
.info-badge.warn {
  color: #D97706;
  background: color-mix(in srgb, #F59E0B 10%, transparent);
}
.info-badge.off {
  color: var(--ds-text-secondary);
  background: color-mix(in srgb, var(--ds-text-secondary) 8%, transparent);
}

/* ── Dark mode shadow adjustments ── */
:global(.dark) .stat-card,
:global(.dark) .panel,
:global(.dark) .action-chip {
  box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1);
}
:global(.dark) .stat-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bottom-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-card {
    padding: 14px 16px;
  }
}
</style>
