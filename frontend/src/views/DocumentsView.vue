<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center" style="gap: 12px;">
        <v-avatar size="48" rounded="lg" color="primary" variant="tonal">
          <v-icon size="28" color="primary">mdi-file-document-multiple</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-bold">Documents</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">Browse and manage your engineering document library</p>
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-cloud-upload" to="/upload">
        Upload New
      </v-btn>
    </div>

    <!-- Filters Bar -->
    <v-card class="mb-4" variant="outlined">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              label="Search documents..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterDiscipline"
              :items="disciplines"
              item-title="label"
              item-value="value"
              label="Discipline"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="Status"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn block color="secondary" variant="outlined" prepend-icon="mdi-filter" @click="loadDocuments">
              Apply
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 300px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" closable>
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon icon="mdi-alert-circle" />
        <span>{{ error }}</span>
      </div>
    </v-alert>

    <!-- Empty State -->
    <v-card v-else-if="!filteredDocuments.length" variant="outlined" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-file-document-multiple-outline</v-icon>
      <div class="text-h6 text-medium-emphasis mb-1">No documents found</div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        Try adjusting your filters or upload a new document
      </div>
      <v-btn color="primary" prepend-icon="mdi-cloud-upload" to="/upload">Upload Document</v-btn>
    </v-card>

    <!-- Documents Table -->
    <v-card v-else>
      <v-data-table
        :headers="headers"
        :items="filteredDocuments"
        :items-per-page="pageSize"
        :page="page"
        :items-length="total"
        :loading="loading"
        hover
        @click:row="handleRowClick"
      >
        <!-- Document Number Column -->
        <template #item.document_number="{ item }">
          <div class="d-flex align-center" style="gap: 8px;">
            <v-avatar size="32" rounded="lg" :color="getDisciplineColor(item.discipline)" variant="tonal">
              <v-icon size="18" :color="getDisciplineColor(item.discipline)">{{ getDisciplineIcon(item.discipline) }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold">{{ item.document_number || `#${item.id}` }}</div>
            </div>
          </div>
        </template>

        <!-- Title Column -->
        <template #item.title="{ item }">
          <div class="text-truncate" style="max-width: 300px;">
            {{ item.title || '—' }}
          </div>
        </template>

        <!-- Revision Column -->
        <template #item.revision="{ item }">
          <v-chip v-if="item.revision" size="small" color="secondary" variant="tonal">
            <v-icon start size="14">mdi-source-branch</v-icon>
            Rev {{ item.revision }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Discipline Column -->
        <template #item.discipline="{ item }">
          <v-chip v-if="item.discipline" size="small" :color="getDisciplineColor(item.discipline)" variant="tonal">
            {{ item.discipline }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <v-chip size="small" :color="getStatusColor(item.status)" variant="tonal">
            <v-icon start size="14">{{ getStatusIcon(item.status) }}</v-icon>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Issue Status Column -->
        <template #item.issue_status="{ item }">
          <v-chip v-if="item.issue_status" size="small" :color="item.issue_status === 'Final' ? 'success' : 'warning'" variant="tonal">
            {{ item.issue_status }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Updated Column -->
        <template #item.updated_at="{ item }">
          <div class="text-body-2">
            {{ formatDate(item.updated_at) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(item.updated_at) }}
          </div>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-eye-outline"
            size="small"
            variant="text"
            color="primary"
            :to="`/documents/${item.id}`"
          />
        </template>

        <!-- Pagination -->
        <template #bottom>
          <v-divider />
          <div class="d-flex align-center justify-space-between pa-3">
            <div class="text-body-2 text-medium-emphasis">
              {{ total }} document(s) total
            </div>
            <v-pagination
              v-model="page"
              :length="totalPages"
              :total-visible="7"
              color="primary"
              density="comfortable"
              @update:model-value="loadDocuments"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getDocuments } from '../api';
import type { DocumentResponse } from '../types';

const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);
const documents = ref<DocumentResponse[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const search = ref('');
const filterDiscipline = ref('');
const filterStatus = ref('');

const disciplines = [
  { label: 'Electrical (ELC)', value: 'ELC' },
  { label: 'Mechanical (MEC)', value: 'MEC' },
  { label: 'Instrumentation (INS)', value: 'INS' },
  { label: 'Simulation (SIM)', value: 'SIM' },
];

const statusOptions = [
  { label: 'Approved', value: 'Approved' },
  { label: 'Checking', value: 'Checking' },
  { label: 'Rejected', value: 'Rejected' },
];

const headers = [
  { title: 'Doc Number', key: 'document_number', sortable: false },
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Revision', key: 'revision', sortable: false },
  { title: 'Discipline', key: 'discipline', sortable: false },
  { title: 'Issue', key: 'issue_status', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Updated', key: 'updated_at', sortable: false },
  { title: '', key: 'actions', sortable: false, width: '60px' },
];

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

const filteredDocuments = computed(() => {
  if (!search.value) return documents.value;
  const q = search.value.toLowerCase();
  return documents.value.filter(
    (d) =>
      d.document_number?.toLowerCase().includes(q) ||
      d.title?.toLowerCase().includes(q) ||
      d.discipline?.toLowerCase().includes(q)
  );
});

function getDisciplineColor(discipline?: string): string {
  switch (discipline?.toUpperCase()) {
    case 'ELC': return 'primary';
    case 'MEC': return 'secondary';
    case 'INS': return 'info';
    case 'SIM': return 'accent';
    default: return 'grey';
  }
}

function getDisciplineIcon(discipline?: string): string {
  switch (discipline?.toUpperCase()) {
    case 'ELC': return 'mdi-flash';
    case 'MEC': return 'mdi-engine';
    case 'INS': return 'mdi-gauge';
    case 'SIM': return 'mdi-laptop';
    default: return 'mdi-file-document';
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved': return 'success';
    case 'checking': return 'primary';
    case 'rejected': return 'error';
    default: return 'grey';
  }
}

function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved': return 'mdi-check-circle';
    case 'checking': return 'mdi-progress-clock';
    case 'rejected': return 'mdi-close-circle';
    default: return 'mdi-help-circle';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString();
}

function handleRowClick(_event: unknown, { item }: { item: DocumentResponse }) {
  // Navigate to document detail using Vue Router
  router.push(`/documents/${item.id}`);
}

async function loadDocuments() {
  loading.value = true;
  error.value = null;

  try {
    const result = await getDocuments(page.value, pageSize.value, {
      discipline: filterDiscipline.value || undefined,
      status: filterStatus.value || undefined,
    });
    documents.value = result.documents;
    total.value = result.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load documents';
  } finally {
    loading.value = false;
  }
}

watch([filterDiscipline, filterStatus], () => {
  page.value = 1;
  loadDocuments();
});

onMounted(() => {
  loadDocuments();
});
</script>