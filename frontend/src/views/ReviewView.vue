<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex align-center mb-6" style="gap: 12px;">
      <v-avatar size="48" rounded="lg" color="error" variant="tonal">
        <v-icon size="28" color="error">mdi-clipboard-check</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-bold">Review Queue</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Low-confidence OCR regions flagged for human review</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <v-row v-if="stats" class="mb-4">
      <v-col cols="12" sm="3">
        <v-card variant="outlined">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold" style="color: #D32F2F;">{{ stats.unreviewed }}</div>
            <div class="text-caption text-medium-emphasis">Unreviewed</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="3">
        <v-card variant="outlined">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold" style="color: #2E7D32;">{{ stats.reviewed }}</div>
            <div class="text-caption text-medium-emphasis">Reviewed</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="3">
        <v-card variant="outlined">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ stats.total_flagged }}</div>
            <div class="text-caption text-medium-emphasis">Total Flagged</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="3">
        <v-card variant="outlined">
          <v-card-text class="text-center pa-3">
            <div class="text-h5 font-weight-bold" style="color: #1565C0;">{{ stats.average_confidence }}</div>
            <div class="text-caption text-medium-emphasis">Avg Confidence</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Progress Bar -->
    <v-card v-if="stats" class="mb-4" variant="outlined">
      <v-card-text>
        <div class="d-flex justify-space-between mb-2">
          <span class="text-body-2 font-weight-medium">Review Progress</span>
          <span class="text-body-2 font-weight-bold">{{ stats.review_progress }}%</span>
        </div>
        <v-progress-linear
          :model-value="stats.review_progress"
          color="primary"
          height="8"
          rounded
          striped
        />
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
    <v-card v-else-if="!regions.length" variant="outlined" class="text-center pa-8">
      <v-icon size="64" color="success" class="mb-3">mdi-check-circle</v-icon>
      <div class="text-h6 text-medium-emphasis mb-1">All caught up!</div>
      <div class="text-body-2 text-medium-emphasis">
        No low-confidence regions pending review
      </div>
    </v-card>

    <!-- Regions List -->
    <v-card v-else>
      <v-card-title class="d-flex align-center" style="gap: 8px;">
        <v-icon color="primary">mdi-clipboard-alert</v-icon>
        <span>Flagged Regions ({{ regions.length }})</span>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-card
          v-for="region in regions"
          :key="region.id"
          class="mb-3"
          variant="outlined"
          hover
          @click="$router.push(`/documents/${region.document_id}`)"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-2">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-avatar :color="getConfidenceColor(region.confidence)" variant="tonal" rounded="lg" size="40">
                  <v-icon :color="getConfidenceColor(region.confidence)" size="20">mdi-alert</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    Document #{{ region.document_id }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Page {{ region.page }} · Region ID: {{ region.id }}
                  </div>
                </div>
              </div>
              <v-chip :color="getConfidenceColor(region.confidence)" variant="tonal" size="small">
                <v-icon start size="14">mdi-percent-circle</v-icon>
                {{ (region.confidence * 100).toFixed(1) }}%
              </v-chip>
            </div>

            <!-- OCR Text -->
            <div v-if="region.text" class="text-body-2 mt-2 pa-3 rounded" style="background: #f5f5f5;">
              <div class="text-caption text-medium-emphasis mb-1">Extracted Text:</div>
              {{ region.text }}
            </div>

            <!-- BBox Info -->
            <div class="d-flex align-center mt-2" style="gap: 8px;">
              <v-chip size="x-small" variant="outlined">
                <v-icon start size="12">mdi-vector-square</v-icon>
                BBox: {{ JSON.stringify(region.bbox) }}
              </v-chip>
              <v-chip size="x-small" variant="outlined">
                <v-icon start size="12">mdi-clock</v-icon>
                {{ formatDate(region.created_at) }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFlaggedRegions, getReviewStats } from '../api';
import type { LowConfidenceRegionResponse, ReviewStatsResponse } from '../types';

const loading = ref(true);
const error = ref<string | null>(null);
const regions = ref<LowConfidenceRegionResponse[]>([]);
const stats = ref<ReviewStatsResponse | null>(null);

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return 'success';
  if (confidence >= 0.5) return 'warning';
  return 'error';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

onMounted(async () => {
  try {
    const [regionsResult, statsResult] = await Promise.all([
      getFlaggedRegions(undefined, false),
      getReviewStats(),
    ]);
    regions.value = regionsResult;
    stats.value = statsResult;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load review queue';
  } finally {
    loading.value = false;
  }
});
</script>