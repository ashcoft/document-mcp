<template>
  <div>
    <!-- Back Button -->
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" to="/documents">
      Back to Documents
    </v-btn>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" closable>
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon icon="mdi-alert-circle" />
        <span>{{ error }}</span>
      </div>
    </v-alert>

    <template v-else-if="doc">
      <!-- Document Header Card -->
      <v-card class="mb-6 overflow-hidden" elevation="3">
        <div class="gradient-header pa-6">
          <v-row align="center">
            <v-col cols="12" md="8">
              <div class="d-flex align-center mb-2" style="gap: 8px;">
                <v-chip size="small" variant="flat" color="white" style="color: #E65100;">
                  <v-icon start size="14">{{ getDisciplineIcon(doc.discipline) }}</v-icon>
                  {{ doc.discipline || 'Unknown' }}
                </v-chip>
                <v-chip v-if="doc.issue_status" size="small" variant="outlined" style="color: white; border-color: rgba(255,255,255,0.5);">
                  {{ doc.issue_status }}
                </v-chip>
                <v-chip size="small" variant="outlined" style="color: white; border-color: rgba(255,255,255,0.5);">
                  <v-icon start size="14">mdi-source-branch</v-icon>
                  Rev {{ doc.revision || '—' }}
                </v-chip>
              </div>
              <h1 class="text-h5 font-weight-bold mb-1" style="color: white;">
                {{ doc.title || 'Untitled Document' }}
              </h1>
              <div class="text-body-1" style="color: rgba(255,255,255,0.9);">
                {{ doc.document_number || `Document #${doc.id}` }}
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-right">
              <v-avatar size="80" rounded="lg" style="background: rgba(255,255,255,0.15);">
                <v-icon size="48" color="white">{{ getDisciplineIcon(doc.discipline) }}</v-icon>
              </v-avatar>
            </v-col>
          </v-row>
        </div>

        <!-- Status Bar -->
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" sm="4">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon :color="getStatusColor(doc.status)" size="28">{{ getStatusIcon(doc.status) }}</v-icon>
                <div>
                  <div class="text-caption text-medium-emphasis">Status</div>
                  <div class="text-subtitle-1 font-weight-bold">{{ doc.status }}</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon color="secondary" size="28">mdi-file-document-multiple</v-icon>
                <div>
                  <div class="text-caption text-medium-emphasis">Pages</div>
                  <div class="text-subtitle-1 font-weight-bold">{{ doc.page_count || '—' }}</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon color="accent" size="28">mdi-file-certificate</v-icon>
                <div>
                  <div class="text-caption text-medium-emphasis">Contract</div>
                  <div class="text-subtitle-1 font-weight-bold text-truncate">{{ doc.contract_number || '—' }}</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Document Information Grid -->
      <v-row class="mb-2">
        <!-- Document Details -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-information</v-icon>
              <span>Document Information</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list density="comfortable" class="bg-transparent">
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-identifier</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Document Number</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">{{ doc.document_number || '—' }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-source-branch</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Revision</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    <v-chip v-if="doc.revision" size="small" color="secondary" variant="tonal">
                      Rev {{ doc.revision }}
                    </v-chip>
                    <span v-else>—</span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-file-certificate</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Issue Status</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    <v-chip v-if="doc.issue_status" size="small" :color="doc.issue_status === 'Final' ? 'success' : 'warning'" variant="tonal">
                      {{ doc.issue_status }}
                    </v-chip>
                    <span v-else>—</span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-file-document-outline</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Contract Number</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">{{ doc.contract_number || '—' }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-engineering</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Discipline</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    <v-chip v-if="doc.discipline" size="small" :color="getDisciplineColor(doc.discipline)" variant="tonal">
                      <v-icon start size="14">{{ getDisciplineIcon(doc.discipline) }}</v-icon>
                      {{ doc.discipline }}
                    </v-chip>
                    <span v-else>—</span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="secondary">mdi-book-open-page-variant</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Page Count</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">{{ doc.page_count || '—' }} pages</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Dates & Audit Info -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-clock-outline</v-icon>
              <span>Dates & Audit</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list density="comfortable" class="bg-transparent">
                <v-list-item>
                  <template #prepend><v-icon color="primary">mdi-calendar-plus</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Created Date</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    {{ formatDate(doc.created_at) }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis">
                    {{ formatTime(doc.created_at) }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="primary">mdi-calendar-refresh</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Last Updated</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    {{ formatDate(doc.updated_at) }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis">
                    {{ formatTime(doc.updated_at) }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="primary">mdi-numeric</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Document ID</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">#{{ doc.id }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider inset />
                <v-list-item>
                  <template #prepend><v-icon color="primary">mdi-check-decagram</v-icon></template>
                  <v-list-item-title class="font-weight-medium">Approval Status</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1">
                    <v-chip size="small" :color="getStatusColor(doc.status)" variant="tonal">
                      <v-icon start size="14">{{ getStatusIcon(doc.status) }}</v-icon>
                      {{ doc.status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row class="mb-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-text class="d-flex flex-wrap align-center" style="gap: 12px;">
              <v-btn color="primary" prepend-icon="mdi-comment-question" to="/ask">
                Ask About This Document
              </v-btn>
              <v-btn color="secondary" variant="outlined" prepend-icon="mdi-magnify" to="/ask">
                Search in Document
              </v-btn>
              <v-btn color="info" variant="tonal" prepend-icon="mdi-download" @click="showNotImplemented">
                Download
              </v-btn>
              <v-btn color="warning" variant="tonal" prepend-icon="mdi-shield-check" :loading="validating" @click="handleValidate">
                Validate
              </v-btn>
              <v-spacer />
              <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="showNotImplemented">
                Delete
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Validation Result -->
      <v-row v-if="validationResult">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon :color="validationResult.passed ? 'success' : 'error'">
                  {{ validationResult.passed ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>
                <span>Validation Result</span>
              </div>
              <v-chip :color="validationResult.passed ? 'success' : 'error'" variant="tonal" size="small">
                {{ validationResult.passed ? 'PASSED' : 'FAILED' }}
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ validationResult.rules_evaluated }}</div>
                    <div class="text-caption text-medium-emphasis">Rules Evaluated</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <div class="text-h5 font-weight-bold" style="color: #D32F2F;">{{ validationResult.rules_failed }}</div>
                    <div class="text-caption text-medium-emphasis">Rules Failed</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <div class="text-h5 font-weight-bold" style="color: #F9A825;">{{ validationResult.warnings.length }}</div>
                    <div class="text-caption text-medium-emphasis">Warnings</div>
                  </div>
                </v-col>
              </v-row>

              <v-alert
                v-if="validationResult.failed_rules.length > 0"
                type="error"
                variant="outlined"
                class="mt-3"
                density="compact"
              >
                <div class="font-weight-bold mb-1">Failed Rules:</div>
                <pre class="text-caption" style="white-space: pre-wrap;">{{ JSON.stringify(validationResult.failed_rules, null, 2) }}</pre>
              </v-alert>

              <v-alert
                v-if="validationResult.warnings.length > 0"
                type="warning"
                variant="outlined"
                class="mt-3"
                density="compact"
              >
                <div class="font-weight-bold mb-1">Warnings:</div>
                <pre class="text-caption" style="white-space: pre-wrap;">{{ JSON.stringify(validationResult.warnings, null, 2) }}</pre>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Agent Actions (if any) -->
      <v-row v-if="agentActions.length > 0">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-robot</v-icon>
              <span>Agent Actions</span>
              <v-chip size="small" color="primary" variant="tonal" class="ml-2">
                {{ agentActions.length }}
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-timeline density="compact" side="end">
                <v-timeline-item
                  v-for="action in agentActions"
                  :key="action.id"
                  size="small"
                  :dot-color="action.success ? 'success' : 'error'"
                >
                  <div class="d-flex align-center" style="gap: 8px;">
                    <v-chip size="x-small" :color="action.success ? 'success' : 'error'" variant="tonal">
                      {{ action.action_type }}
                    </v-chip>
                    <span class="text-body-2 font-weight-bold">{{ action.decision }}</span>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatDate(action.created_at) }}
                    </span>
                  </div>
                  <div v-if="action.reasoning" class="text-body-2 text-medium-emphasis mt-1">
                    {{ action.reasoning }}
                  </div>
                  <div v-if="action.confidence !== null" class="mt-1">
                    <v-chip size="x-small" variant="outlined">
                      <v-icon start size="12">mdi-percent-circle</v-icon>
                      Confidence: {{ (action.confidence * 100).toFixed(1) }}%
                    </v-chip>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getDocument, getAgentActions, validateDocument } from '../api';
import type { DocumentResponse, AgentActionResponse, ValidationResponse } from '../types';

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const doc = ref<DocumentResponse | null>(null);
const agentActions = ref<AgentActionResponse[]>([]);
const validating = ref(false);
const validationResult = ref<ValidationResponse | null>(null);

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

function showNotImplemented() {
  // Placeholder for not-yet-implemented features
  console.log('Feature not implemented');
}

async function handleValidate() {
  if (!doc.value) return;
  validating.value = true;
  try {
    validationResult.value = await validateDocument(doc.value.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Validation failed';
  } finally {
    validating.value = false;
  }
}

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) {
    error.value = 'Invalid document ID';
    loading.value = false;
    return;
  }

  try {
    doc.value = await getDocument(id);

    // Also load agent actions for this document
    try {
      const actionsResult = await getAgentActions({ document_id: id, limit: 20 });
      agentActions.value = actionsResult.actions;
    } catch {
      // Agent actions might fail, that's ok
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load document';
  } finally {
    loading.value = false;
  }
});
</script>