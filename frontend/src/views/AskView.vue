<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex align-center mb-6" style="gap: 12px;">
      <v-avatar size="48" rounded="lg" color="primary" variant="tonal">
        <v-icon size="28" color="primary">mdi-comment-question</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-bold">Ask & Search</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Query your engineering documents with natural language</p>
      </div>
    </div>

    <v-row>
      <!-- Query Form -->
      <v-col cols="12" md="5">
        <v-card class="mb-4">
          <v-card-title class="gradient-header d-flex align-center" style="gap: 8px;">
            <v-icon color="white">mdi-magnify</v-icon>
            <span class="text-white">Query</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <!-- Mode Toggle -->
            <v-btn-toggle v-model="mode" mandatory color="primary" class="mb-4" rounded="lg" width="100%">
              <v-btn value="qa" prepend-icon="mdi-comment-question" style="flex: 1;">Q&A</v-btn>
              <v-btn value="search" prepend-icon="mdi-magnify" style="flex: 1;">Search</v-btn>
            </v-btn-toggle>

            <!-- Query Input -->
            <v-textarea
              v-model="query"
              :label="mode === 'qa' ? 'Ask a question...' : 'Search for...'"
              :placeholder="mode === 'qa' ? 'e.g., What is the voltage rating of the main transformer?' : 'e.g., transformer, SLD, equipment ratings'"
              prepend-inner-icon="mdi-comment-text"
              rows="4"
              auto-grow
              @keydown.ctrl.enter="handleSubmit"
            />

            <!-- Discipline Filter -->
            <v-select
              v-model="discipline"
              :items="disciplines"
              item-title="label"
              item-value="value"
              label="Filter by discipline"
              prepend-inner-icon="mdi-engineering"
              clearable
              class="mt-3"
            />

            <!-- Submit Button -->
            <v-btn
              block
              size="large"
              color="primary"
              class="mt-3"
              :disabled="!query.trim() || loading"
              :loading="loading"
              :prepend-icon="mode === 'qa' ? 'mdi-comment-question' : 'mdi-magnify'"
              @click="handleSubmit"
            >
              {{ loading ? 'Working...' : mode === 'qa' ? 'Ask' : 'Search' }}
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Tips Card -->
        <v-card variant="outlined">
          <v-card-text>
            <div class="d-flex align-center mb-2" style="gap: 8px;">
              <v-icon color="info" size="20">mdi-lightbulb-on</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Tips</span>
            </div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item density="compact" class="px-0">
                <v-list-item-title class="text-body-2 text-medium-emphasis">
                  Use <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit quickly
                </v-list-item-title>
              </v-list-item>
              <v-list-item density="compact" class="px-0">
                <v-list-item-title class="text-body-2 text-medium-emphasis">
                  Q&A mode provides AI-generated answers with citations
                </v-list-item-title>
              </v-list-item>
              <v-list-item density="compact" class="px-0">
                <v-list-item-title class="text-body-2 text-medium-emphasis">
                  Search mode returns matching document chunks
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Results Panel -->
      <v-col cols="12" md="7">
        <!-- Loading -->
        <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 300px;">
          <div class="text-center">
            <v-progress-circular indeterminate color="primary" size="64" class="mb-3" />
            <div class="text-body-1 text-medium-emphasis">
              {{ mode === 'qa' ? 'Generating answer...' : 'Searching documents...' }}
            </div>
          </div>
        </div>

        <!-- Error -->
        <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
          closable
        >
          <div class="d-flex align-center" style="gap: 8px;">
            <v-icon icon="mdi-alert-circle" />
            <span>{{ error }}</span>
          </div>
        </v-alert>

        <!-- Q&A Result -->
        <div v-else-if="qaResult">
          <!-- Answer Card -->
          <v-card class="mb-4" elevation="3">
            <v-card-title class="gradient-header-blue d-flex align-center justify-space-between">
              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon color="white">mdi-robot</v-icon>
                <span class="text-white">AI Answer</span>
              </div>
              <v-chip
                :color="getConfidenceColor(qaResult.confidence)"
                variant="flat"
                size="small"
              >
                <v-icon start :icon="getConfidenceIcon(qaResult.confidence)" />
                {{ qaResult.confidence }} Confidence
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="rich-text text-body-1" style="line-height: 1.8;">
                {{ qaResult.answer }}
              </div>

              <v-divider class="my-3" />

              <div class="d-flex align-center" style="gap: 8px;">
                <v-icon size="18" color="secondary">mdi-file-document-multiple</v-icon>
                <span class="text-body-2 text-medium-emphasis">
                  Based on {{ qaResult.context_chunks_used }} document chunk(s)
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Citations -->
          <v-card v-if="qaResult.citations.length > 0">
            <v-card-title class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-bookmark-multiple</v-icon>
              <span>Citations ({{ qaResult.citations.length }})</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list lines="two">
                <v-list-item
                  v-for="(citation, index) in qaResult.citations"
                  :key="index"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar color="secondary" variant="tonal" rounded="lg" size="40">
                      <v-icon color="secondary">mdi-file-document</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">
                    {{ citation.document_number }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="citation.title">
                    {{ citation.title }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    <v-icon size="14" class="mr-1">mdi-map-marker</v-icon>
                    {{ citation.page_or_sheet }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResult">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center" style="gap: 8px;">
              <v-icon color="primary">mdi-magnify</v-icon>
              <span class="text-h6 font-weight-bold">Search Results</span>
            </div>
            <v-chip color="primary" variant="tonal" size="small">
              {{ searchResult.total }} found
            </v-chip>
          </div>

          <v-card
            v-for="result in searchResult.results"
            :key="result.chunk_id"
            class="mb-3"
            hover
            @click="$router.push(`/documents/${result.document_id}`)"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-2">
                <div class="d-flex align-center" style="gap: 8px;">
                  <v-avatar color="secondary" variant="tonal" rounded="lg" size="36">
                    <v-icon color="secondary" size="20">mdi-file-document</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">
                      {{ result.document_number || `Document #${result.document_id}` }}
                    </div>
                    <div v-if="result.title" class="text-caption text-medium-emphasis">
                      {{ result.title }}
                    </div>
                  </div>
                </div>
                <v-chip
                  :color="getScoreColor(result.score)"
                  variant="tonal"
                  size="small"
                >
                  <v-icon start size="14">mdi-percent-circle</v-icon>
                  {{ (result.score * 100).toFixed(1) }}%
                </v-chip>
              </div>

              <div class="text-body-2 mt-2" style="line-height: 1.6;">
                {{ result.content }}
              </div>

              <div class="d-flex align-center mt-3" style="gap: 8px;">
                <v-chip v-if="result.discipline" size="x-small" color="primary" variant="tonal">
                  {{ result.discipline }}
                </v-chip>
                <v-chip size="x-small" color="secondary" variant="tonal">
                  {{ result.search_type }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty State -->
        <v-card v-else variant="outlined" class="text-center pa-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-comment-question-outline</v-icon>
          <div class="text-h6 text-medium-emphasis mb-1">No results yet</div>
          <div class="text-body-2 text-medium-emphasis">
            Enter a question or search query to get started
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { askQuestion, searchDocuments } from '../api';
import type { AskResponse, SearchResponse } from '../types';

const query = ref('');
const discipline = ref('');
const mode = ref<'qa' | 'search'>('qa');
const loading = ref(false);
const error = ref<string | null>(null);
const qaResult = ref<AskResponse | null>(null);
const searchResult = ref<SearchResponse | null>(null);

const disciplines = [
  { label: 'Electrical (ELC)', value: 'ELC' },
  { label: 'Mechanical (MEC)', value: 'MEC' },
  { label: 'Instrumentation (INS)', value: 'INS' },
  { label: 'Simulation (SIM)', value: 'SIM' },
];

function getConfidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high': return 'success';
    case 'medium': return 'warning';
    case 'low': return 'error';
    default: return 'grey';
  }
}

function getConfidenceIcon(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high': return 'mdi-check-circle';
    case 'medium': return 'mdi-alert';
    case 'low': return 'mdi-alert-circle';
    default: return 'mdi-help-circle';
  }
}

function getScoreColor(score: number): string {
  if (score >= 0.75) return 'success';
  if (score >= 0.5) return 'warning';
  return 'error';
}

async function handleSubmit() {
  if (!query.value.trim()) {
    error.value = 'Please enter a question or search query.';
    return;
  }

  loading.value = true;
  error.value = null;
  qaResult.value = null;
  searchResult.value = null;

  try {
    if (mode.value === 'qa') {
      qaResult.value = await askQuestion({
        query: query.value.trim(),
        discipline: discipline.value || undefined,
      });
    } else {
      searchResult.value = await searchDocuments({
        query: query.value.trim(),
        limit: 10,
        discipline: discipline.value || undefined,
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed';
  } finally {
    loading.value = false;
  }
}
</script>