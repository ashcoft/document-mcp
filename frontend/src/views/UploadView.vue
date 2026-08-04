<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex align-center mb-6" style="gap: 12px;">
      <v-avatar size="48" rounded="lg" color="primary" variant="tonal">
        <v-icon size="28" color="primary">mdi-cloud-upload</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-bold">Upload Document</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Submit engineering documents for AI-powered validation</p>
      </div>
    </div>

    <v-row>
      <!-- Upload Form -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title class="gradient-header-blue d-flex align-center" style="gap: 8px;">
            <v-icon color="white">mdi-file-upload</v-icon>
            <span class="text-white">Document Submission</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <!-- Drag & Drop Zone -->
            <div
              class="drop-zone"
              :class="{ 'drop-zone--active': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                class="d-none"
                accept=".pdf,.dwg,.dxf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.tif,.tiff"
                @change="handleFileSelect"
              />
              <div v-if="!file" class="text-center pa-8">
                <v-icon size="64" color="primary" class="mb-3">mdi-cloud-upload-outline</v-icon>
                <div class="text-h6 font-weight-bold mb-1">Drop file here or click to browse</div>
                <div class="text-body-2 text-medium-emphasis">
                  Supports: PDF, DWG, DXF, DOCX, XLSX, PPTX, PNG, JPG, TIFF
                </div>
              </div>
              <div v-else class="d-flex align-center pa-4" style="gap: 12px;">
                <v-avatar size="48" rounded="lg" :color="getFileColor(file.name)" variant="tonal">
                  <v-icon :color="getFileColor(file.name)">{{ getFileIcon(file.name) }}</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-bold">{{ file.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ formatFileSize(file.size) }}</div>
                </div>
                <v-btn icon="mdi-close" variant="text" size="small" @click.stop="clearFile" />
              </div>
            </div>

            <!-- Discipline Selector -->
            <div class="mt-4">
              <div class="text-subtitle-2 mb-2">Discipline</div>
              <v-select
                v-model="discipline"
                :items="disciplines"
                item-title="label"
                item-value="value"
                label="Select discipline (optional)"
                prepend-inner-icon="mdi-engineering"
                clearable
              />
            </div>

            <!-- Upload Button -->
            <v-btn
              block
              size="x-large"
              color="primary"
              class="mt-4"
              :disabled="!file || uploading"
              :loading="uploading"
              prepend-icon="mdi-upload"
              @click="handleUpload"
            >
              {{ uploading ? 'Uploading...' : 'Upload Document' }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Status Panel -->
      <v-col cols="12" md="5">
        <!-- Upload Result -->
        <v-card v-if="uploadResult" class="mb-4">
          <v-card-title class="d-flex align-center" style="gap: 8px;">
            <v-icon color="success">mdi-check-circle</v-icon>
            <span>Upload Successful</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend><v-icon>mdi-file</v-icon></template>
                <v-list-item-title>{{ uploadResult.filename }}</v-list-item-title>
                <v-list-item-subtitle>Filename</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon>mdi-identifier</v-icon></template>
                <v-list-item-title>{{ uploadResult.job_id }}</v-list-item-title>
                <v-list-item-subtitle>Job ID</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon>mdi-numeric</v-icon></template>
                <v-list-item-title>{{ uploadResult.document_id }}</v-list-item-title>
                <v-list-item-subtitle>Document ID</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-alert type="info" variant="tonal" class="mt-3" density="compact">
              {{ uploadResult.message }}
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Processing Status -->
        <v-card v-if="status">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center" style="gap: 8px;">
              <v-icon :color="getStatusColor(status.status)">{{ getStatusIcon(status.status) }}</v-icon>
              <span>Processing Status</span>
            </div>
            <v-chip :color="getStatusColor(status.status)" size="small" variant="tonal">
              {{ status.status }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <!-- Progress Bar -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Progress</span>
                <span class="text-body-2 font-weight-bold">{{ status.progress }}%</span>
              </div>
              <v-progress-linear
                :model-value="status.progress"
                :color="getStatusColor(status.status)"
                height="10"
                rounded
                striped
              />
            </div>

            <!-- Status Message -->
            <v-alert
              v-if="status.message"
              :type="status.status === 'Rejected' ? 'error' : 'info'"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ status.message }}
            </v-alert>

            <!-- Rejection Note -->
            <v-alert
              v-if="status.rejection_note"
              type="error"
              variant="outlined"
              density="compact"
              class="mb-3"
            >
              <div class="font-weight-bold mb-1">Rejection Details:</div>
              <pre class="text-caption" style="white-space: pre-wrap;">{{ JSON.stringify(status.rejection_note, null, 2) }}</pre>
            </v-alert>

            <!-- Timestamps -->
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template #prepend><v-icon size="20">mdi-clock-start</v-icon></template>
                <v-list-item-title class="text-body-2">
                  Started: {{ formatDate(status.created_at) }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon size="20">mdi-clock-end</v-icon></template>
                <v-list-item-title class="text-body-2">
                  Updated: {{ formatDate(status.updated_at) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>

            <!-- View Document Button -->
            <v-btn
              v-if="status.status === 'Approved'"
              block
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-file-eye"
              class="mt-3"
              :to="`/documents/${status.document_id}`"
            >
              View Document Details
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Error Display -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
        >
          <div class="d-flex align-center" style="gap: 8px;">
            <v-icon icon="mdi-alert-circle" />
            <span>{{ error }}</span>
          </div>
        </v-alert>

        <!-- Info Card (when no upload yet) -->
        <v-card v-if="!uploadResult && !status && !error">
          <v-card-title class="d-flex align-center" style="gap: 8px;">
            <v-icon color="info">mdi-information-outline</v-icon>
            <span>How It Works</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item size="small" dot-color="primary">
                <div class="font-weight-bold">Upload</div>
                <div class="text-body-2 text-medium-emphasis">Select or drag a file to upload</div>
              </v-timeline-item>
              <v-timeline-item size="small" dot-color="primary">
                <div class="font-weight-bold">AI Processing</div>
                <div class="text-body-2 text-medium-emphasis">OCR, parsing, and validation</div>
              </v-timeline-item>
              <v-timeline-item size="small" dot-color="primary">
                <div class="font-weight-bold">Review</div>
                <div class="text-body-2 text-medium-emphasis">Agent evaluates document quality</div>
              </v-timeline-item>
              <v-timeline-item size="small" dot-color="success">
                <div class="font-weight-bold">Approved</div>
                <div class="text-body-2 text-medium-emphasis">Document available for search & Q&A</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { uploadDocument, getUploadStatus } from '../api';
import type { UploadResponse, StatusResponse } from '../types';

const file = ref<File | null>(null);
const discipline = ref('');
const uploading = ref(false);
const uploadResult = ref<UploadResponse | null>(null);
const status = ref<StatusResponse | null>(null);
const error = ref<string | null>(null);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

let pollInterval: ReturnType<typeof setInterval> | null = null;
let hasUnmounted = false;

const disciplines = [
  { label: 'Electrical (ELC)', value: 'ELC' },
  { label: 'Mechanical (MEC)', value: 'MEC' },
  { label: 'Instrumentation (INS)', value: 'INS' },
  { label: 'Simulation (SIM)', value: 'SIM' },
];

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const selected = target.files?.[0] ?? null;
  if (selected) {
    file.value = selected;
    resetResults();
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const droppedFile = e.dataTransfer?.files?.[0] ?? null;
  if (droppedFile) {
    file.value = droppedFile;
    resetResults();
  }
}

function clearFile() {
  file.value = null;
  resetResults();
  if (fileInput.value) fileInput.value.value = '';
}

function resetResults() {
  uploadResult.value = null;
  status.value = null;
  error.value = null;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'mdi-file-pdf-box';
  if (['dwg', 'dxf'].includes(ext)) return 'mdi-file-cad';
  if (['doc', 'docx'].includes(ext)) return 'mdi-file-word-box';
  if (['xls', 'xlsx'].includes(ext)) return 'mdi-file-excel-box';
  if (['ppt', 'pptx'].includes(ext)) return 'mdi-file-powerpoint-box';
  if (['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext)) return 'mdi-file-image-box';
  return 'mdi-file-document';
}

function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'error';
  if (['dwg', 'dxf'].includes(ext)) return 'primary';
  if (['doc', 'docx'].includes(ext)) return 'info';
  if (['xls', 'xlsx'].includes(ext)) return 'success';
  if (['ppt', 'pptx'].includes(ext)) return 'warning';
  if (['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext)) return 'accent';
  return 'secondary';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusColor(statusStr: string): string {
  switch (statusStr.toLowerCase()) {
    case 'approved': return 'success';
    case 'checking': return 'primary';
    case 'rejected': return 'error';
    default: return 'grey';
  }
}

function getStatusIcon(statusStr: string): string {
  switch (statusStr.toLowerCase()) {
    case 'approved': return 'mdi-check-circle';
    case 'checking': return 'mdi-progress-clock';
    case 'rejected': return 'mdi-close-circle';
    default: return 'mdi-help-circle';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

async function handleUpload() {
  if (!file.value) {
    error.value = 'Please select a file to upload.';
    return;
  }

  resetResults();
  uploading.value = true;

  try {
    const result = await uploadDocument(file.value, discipline.value || undefined);
    uploadResult.value = result;

    // Start polling for status
    if (hasUnmounted) {
      return;
    }
    pollInterval = setInterval(async () => {
      if (hasUnmounted) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }
      try {
        const statusUpdate = await getUploadStatus(result.job_id);
        status.value = statusUpdate;

        if (statusUpdate.status === 'Approved' || statusUpdate.status === 'Rejected') {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (err) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        error.value = err instanceof Error ? err.message : 'Failed to get status';
      }
    }, 2000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

onUnmounted(() => {
  hasUnmounted = true;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone:hover {
  border-color: #E65100;
  background-color: #FFF3E0;
}

.drop-zone--active {
  border-color: #E65100;
  background-color: #FFE0B2;
  transform: scale(1.01);
}
</style>
