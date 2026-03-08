<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: {
    type: Object,
    required: true
  },
  addressQuery: {
    type: String,
    default: ''
  },
  tagFilter: {
    type: String,
    default: null
  },
  sourceMetaFilter: {
    type: String,
    default: null
  },
  dateFromFilter: {
    type: String,
    default: null
  },
  dateToFilter: {
    type: String,
    default: null
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  availableSourceMetas: {
    type: Array,
    default: () => []
  },
  showAdvancedFilters: {
    type: Boolean,
    default: false
  },
  hasActiveFilters: {
    type: Boolean,
    default: false
  },
  activeFilters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:addressQuery',
  'update:tagFilter',
  'update:sourceMetaFilter',
  'update:dateFromFilter',
  'update:dateToFilter',
  'search',
  'toggle-advanced',
  'apply-filters',
  'clear-all',
  'open-tag-stats',
  'remove-filter'
])

const addressQueryModel = computed({
  get: () => props.addressQuery,
  set: (value) => emit('update:addressQuery', value)
})

const tagFilterModel = computed({
  get: () => props.tagFilter,
  set: (value) => emit('update:tagFilter', value)
})

const sourceMetaFilterModel = computed({
  get: () => props.sourceMetaFilter,
  set: (value) => emit('update:sourceMetaFilter', value)
})

const dateFromFilterModel = computed({
  get: () => props.dateFromFilter,
  set: (value) => emit('update:dateFromFilter', value)
})

const dateToFilterModel = computed({
  get: () => props.dateToFilter,
  set: (value) => emit('update:dateToFilter', value)
})
</script>

<template>
  <n-card embedded :bordered="false" class="account-filter-card">
    <div class="filter-card-head">
      <div>
        <p class="filter-title">{{ labels.query }}</p>
        <p class="filter-subtitle">{{ labels.tableSubtitle }}</p>
      </div>
      <n-button tertiary @click="emit('open-tag-stats')">{{ labels.openTagStats }}</n-button>
    </div>

    <div class="search-row">
      <n-input-group class="search-group">
        <n-input
          v-model:value="addressQueryModel"
          clearable
          :placeholder="labels.addressQueryTip"
          @keydown.enter="emit('search')"
        />
        <n-button type="primary" @click="emit('search')">
          {{ labels.query }}
        </n-button>
      </n-input-group>

      <n-space>
        <n-button tertiary @click="emit('toggle-advanced')">
          {{ showAdvancedFilters ? labels.hideAdvancedFilters : labels.advancedFilters }}
        </n-button>
        <n-button tertiary @click="emit('clear-all')">{{ labels.clearFilters }}</n-button>
      </n-space>
    </div>

    <n-collapse-transition :show="showAdvancedFilters">
      <div class="advanced-row">
        <n-select
          v-model:value="tagFilterModel"
          :options="availableTags"
          :placeholder="labels.filterByTag"
          clearable
          filterable
          @update:value="emit('apply-filters')"
        />
        <n-select
          v-model:value="sourceMetaFilterModel"
          :options="availableSourceMetas"
          :placeholder="labels.filterBySource"
          clearable
          @update:value="emit('apply-filters')"
        />
        <n-date-picker
          v-model:formatted-value="dateFromFilterModel"
          type="date"
          clearable
          value-format="yyyy-MM-dd"
          :placeholder="labels.dateFrom"
          @update:value="emit('apply-filters')"
        />
        <n-date-picker
          v-model:formatted-value="dateToFilterModel"
          type="date"
          clearable
          value-format="yyyy-MM-dd"
          :placeholder="labels.dateTo"
          @update:value="emit('apply-filters')"
        />
      </div>
    </n-collapse-transition>

    <div v-if="hasActiveFilters" class="active-filter-row">
      <span class="active-filter-label">{{ labels.activeFilters }}</span>
      <n-space>
        <n-tag
          v-for="filter in activeFilters"
          :key="filter.key"
          closable
          @close="emit('remove-filter', filter.key)"
        >
          {{ filter.label }}
        </n-tag>
        <n-button text size="tiny" @click="emit('clear-all')">{{ labels.clearAllActiveFilters }}</n-button>
      </n-space>
    </div>
  </n-card>
</template>

<style scoped>
.account-filter-card {
  border-radius: var(--ds-radius);
  border: 1px solid color-mix(in srgb, var(--ds-border) 80%, transparent);
}

.filter-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.filter-title {
  margin: 0;
  font-size: 14px;
  color: var(--ds-text-secondary);
  font-weight: 600;
}

.filter-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ds-text-secondary);
}

.search-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 340px;
}

.advanced-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.active-filter-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.active-filter-label {
  font-size: 12px;
  color: var(--ds-text-secondary);
  font-weight: 600;
}

@media (max-width: 960px) {
  .advanced-row {
    grid-template-columns: 1fr 1fr;
  }

  .search-group {
    min-width: 100%;
  }
}

@media (max-width: 640px) {
  .advanced-row {
    grid-template-columns: 1fr;
  }
}
</style>
