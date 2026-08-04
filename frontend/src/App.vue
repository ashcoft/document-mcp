<template>
  <v-app>
    <!-- ============================================================ -->
    <!-- Navigation Drawer -->
    <!-- ============================================================ -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      width="260"
      color="surface"
    >
      <!-- Logo / Brand -->
      <div class="pa-4 d-flex align-center" style="gap: 12px;">
        <v-avatar size="40" rounded="lg" color="primary">
          <v-icon size="24" color="white">mdi-file-document-multiple</v-icon>
        </v-avatar>
        <div v-if="!rail">
          <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.2;">
            DocControl
          </div>
          <div class="text-caption text-medium-emphasis" style="line-height: 1.2;">
            Engineering System
          </div>
        </div>
      </div>

      <v-divider />

      <!-- Navigation Items -->
      <v-list nav density="comfortable" color="primary">
        <v-list-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="item.subtitle"
          rounded="lg"
          link
        />
      </v-list>

      <template #append>
        <v-divider />
        <!-- Theme Toggle -->
        <div class="pa-3">
          <v-btn
            block
            variant="text"
            :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            @click="toggleTheme"
          >
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- ============================================================ -->
    <!-- App Bar -->
    <!-- ============================================================ -->
    <v-app-bar flat color="surface" elevation="1">
      <template #prepend>
        <v-btn
          icon="mdi-menu"
          variant="text"
          @click.stop="rail = !rail"
        />
      </template>

      <v-app-bar-title>
        <div class="d-flex align-center" style="gap: 8px;">
          <v-icon :icon="currentIcon" color="primary" />
          <span class="text-h6 font-weight-bold">{{ currentTitle }}</span>
        </div>
      </v-app-bar-title>

      <template #append>
        <!-- Backend Status Indicator -->
        <v-chip
          :color="backendStatus.color"
          variant="tonal"
          size="small"
          class="mr-2"
        >
          <v-icon start :icon="backendStatus.icon" />
          {{ backendStatus.text }}
        </v-chip>

        <v-btn icon="mdi-bell-outline" variant="text">
          <v-badge content="0" color="error">
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
          <v-menu activator="parent" location="bottom end">
            <v-card min-width="300">
              <v-card-text class="text-center text-medium-emphasis">
                No new notifications
              </v-card-text>
            </v-card>
          </v-menu>
        </v-btn>

        <v-btn class="ml-1" variant="text" size="small">
          <v-avatar size="32" color="secondary">
            <v-icon color="white">mdi-account</v-icon>
          </v-avatar>
          <v-menu activator="parent" location="bottom end">
            <v-card min-width="200">
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-account-outline" title="Profile" />
                <v-list-item prepend-icon="mdi-cog-outline" title="Settings" />
                <v-divider />
                <v-list-item prepend-icon="mdi-logout" title="Sign Out" />
              </v-list>
            </v-card>
          </v-menu>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- ============================================================ -->
    <!-- Main Content -->
    <!-- ============================================================ -->
    <v-main>
      <v-container fluid class="pa-6" style="max-width: 1400px; margin: 0 auto;">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Global Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon :icon="snackbar.icon" />
        <span>{{ snackbar.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from 'vuetify';

const route = useRoute();
const theme = useTheme();

// Navigation drawer state
const drawer = ref(true);
const rail = ref(false);

// Theme
const isDark = ref(false);
function toggleTheme() {
  isDark.value = !isDark.value;
  theme.global.name.value = isDark.value ? 'dark' : 'light';
}

// Navigation items
const navItems = [
  { path: '/', title: 'Dashboard', subtitle: 'System overview', icon: 'mdi-view-dashboard-outline' },
  { path: '/upload', title: 'Upload', subtitle: 'Submit documents', icon: 'mdi-cloud-upload-outline' },
  { path: '/ask', title: 'Ask & Search', subtitle: 'Q&A and search', icon: 'mdi-comment-question-outline' },
  { path: '/documents', title: 'Documents', subtitle: 'Document library', icon: 'mdi-file-document-multiple-outline' },
  { path: '/review', title: 'Review Queue', subtitle: 'Low-confidence regions', icon: 'mdi-clipboard-check-outline' },
];

// Current route info
const currentTitle = computed(() => (route.meta.title as string) || 'Document Control');
const currentIcon = computed(() => (route.meta.icon as string) || 'mdi-file-document');

// Backend status
const backendOnline = ref(false);
const backendStatus = computed(() => {
  if (backendOnline.value) {
    return { color: 'success', icon: 'mdi-server-network', text: 'Online' };
  }
  return { color: 'error', icon: 'mdi-server-network-off', text: 'Offline' };
});

// Snackbar
const snackbar = reactive({
  show: false,
  text: '',
  color: 'info' as string,
  icon: 'mdi-information',
  timeout: 4000,
});

// Check backend health on mount
onMounted(async () => {
  try {
    const response = await fetch('/health');
    if (response.ok) {
      backendOnline.value = true;
    }
  } catch {
    backendOnline.value = false;
  }
});
</script>