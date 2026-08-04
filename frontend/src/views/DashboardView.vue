<template>
  <div>
    <!-- Welcome Banner -->
    <v-card class="mb-6 overflow-hidden" elevation="3">
      <div class="gradient-header pa-6">
        <v-row align="center">
          <v-col cols="12" md="8">
            <h1 class="text-h4 font-weight-bold mb-2" style="color: white;">
              Engineering Document Control
            </h1>
            <p class="text-body-1 mb-0" style="color: rgba(255,255,255,0.9);">
              Manage, search, and query your engineering documents with AI-powered validation
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-right d-none d-md-block">
            <v-icon size="80" style="color: rgba(255,255,255,0.3);">mdi-file-document-multiple</v-icon>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 300px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
    >
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon icon="mdi-alert-circle" />
        <span>{{ error }}</span>
      </div>
    </v-alert>

    <template v-else-if="metrics">
      <!-- Stats Cards Row -->
      <v-row class="mb-2">
        <!-- Total Documents -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100" hover @click="$router.push('/documents')">
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="text-caption text-medium-emphasis mb-1">Total Documents</div>
                  <div class="text-h4 font-weight-bold" style="color: #1565C0;">
                    {{ metrics.documents.total }}
                  </div>
                </div>
                <v-avatar size="48" rounded="lg" color="secondary" variant="tonal">
                  <v-icon size="28" color="secondary">mdi-file-document-multiple</v-icon>
                </v-avatar>
              </div>
              <div class="d-flex align-center" style="gap: 4px;">
                <v-icon size="16" color="success">mdi-trending-up</v-icon>
                <span class="text-caption text-medium-emphasis">All documents in system</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Approved Documents -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100" hover @click="$router.push('/documents')">
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="text-caption text-medium-emphasis mb-1">Approved</div>
                  <div class="text-h4 font-weight-bold" style="color: #2E7D32;">
                    {{ metrics.documents.by_status.Approved || 0 }}
                  </div>
                </div>
                <v-avatar size="48" rounded="lg" color="success" variant="tonal">
                  <v-icon size="28" color="success">mdi-check-circle</v-icon>
                </v-avatar>
              </div>
              <div class="d-flex align-center" style="gap: 4px;">
                <v-icon size="16" color="success">mdi-check</v-icon>
                <span class="text-caption text-medium-emphasis">Ready for reference</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Checking Documents -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100" hover @click="$router.push('/documents')">
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="text-caption text-medium-emphasis mb-1">In Review</div>
                  <div class="text-h4 font-weight-bold" style="color: #E65100;">
                    {{ metrics.documents.by_status.Checking || 0 }}
                  </div>
                </div>
                <v-avatar size="48" rounded="lg" color="primary" variant="tonal">
                  <v-icon size="28" color="primary">mdi-progress-clock</v-icon>
                </v-avatar>
              </div>
              <div class="d-flex align-center" style="gap: 4px;">
                <v-icon size="16" color="warning">mdi-clock-outline</v-icon>
                <span class="text-caption text-medium-emphasis">Being processed</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Review Queue -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100" hover @click="$router.push('/review')">
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="text-caption text-medium-emphasis mb-1">Review Queue</div>
                  <div class="text-h4 font-weight-bold" style="color: #D32F2F;">
                    {{ metrics.review_queue.unreviewed_regions }}
                  </div>
                </div>
                <v-avatar size="48" rounded="lg" color="error" variant="tonal">
                  <v-icon size="28" color="error">mdi-clipboard-alert</v-icon>
                </v-avatar>
              </div>
              <div class="d-flex align-center" style="gap: 4px;">
                <v-icon size="16" color="error">mdi-alert</v-icon>
                <span class="text-caption text-medium-emphasis">Low-confidence regions</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Activity & Quick Actions -->
      <v-row>
        <!-- Activity Panel -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-chart-line</v-icon>
              <span>System Activity</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <v-icon size="40" color="secondary" class="mb-2">mdi-robot</v-icon>
                    <div class="text-h5 font-weight-bold">{{ metrics.activity.recent_agent_actions }}</div>
                    <div class="text-caption text-medium-emphasis">Agent Actions (24h)</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <v-icon size="40" color="primary" class="mb-2">mdi-comment-question</v-icon>
                    <div class="text-h5 font-weight-bold">{{ metrics.activity.recent_qa_queries }}</div>
                    <div class="text-caption text-medium-emphasis">Q&A Queries (24h)</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center pa-3">
                    <v-icon size="40" color="accent" class="mb-2">mdi-file-upload</v-icon>
                    <div class="text-h5 font-weight-bold">{{ metrics.activity.total_submissions }}</div>
                    <div class="text-caption text-medium-emphasis">Total Submissions</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Quick Actions -->
        <v-col cols="12" md="4">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-lightning-bolt</v-icon>
              <span>Quick Actions</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="d-flex flex-column" style="gap: 12px;">
              <v-btn
                block
                size="large"
                color="primary"
                prepend-icon="mdi-cloud-upload"
                to="/upload"
              >
                Upload Document
              </v-btn>
              <v-btn
                block
                size="large"
                color="secondary"
                variant="outlined"
                prepend-icon="mdi-comment-question"
                to="/ask"
              >
                Ask a Question
              </v-btn>
              <v-btn
                block
                size="large"
                color="secondary"
                variant="outlined"
                prepend-icon="mdi-magnify"
                to="/ask"
              >
                Search Documents
              </v-btn>
              <v-btn
                block
                size="large"
                color="info"
                variant="tonal"
                prepend-icon="mdi-file-document-multiple"
                to="/documents"
              >
                Browse Documents
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Document Status Breakdown -->
      <v-row class="mt-2">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-chart-donut</v-icon>
              <span>Document Status Breakdown</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col v-for="(count, status) in metrics.documents.by_status" :key="status" cols="12" sm="4">
                  <div class="d-flex align-center" style="gap: 12px;">
                    <v-avatar :color="getStatusColor(status)" size="48" rounded="lg" variant="tonal">
                      <v-icon :color="getStatusColor(status)">{{ getStatusIcon(status) }}</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-h5 font-weight-bold">{{ count }}</div>
                      <div class="text-caption text-medium-emphasis text-uppercase">{{ status }}</div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSystemMetrics } from '../api';
import type { SystemMetricsResponse } from '../types';

const loading = ref(true);
const error = ref<string | null>(null);
const metrics = ref<SystemMetricsResponse | null>(null);

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

onMounted(async () => {
  try {
    metrics.value = await getSystemMetrics();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load metrics';
  } finally {
    loading.value = false;
  }
});
</script>