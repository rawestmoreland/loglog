import * as BackgroundTask from 'expo-background-task';

export async function registerBackgroundTaskAsync(identifier: string) {
  return BackgroundTask.registerTaskAsync(identifier);
}

export async function unregisterBackgroundTaskAsync(identifier: string) {
  return BackgroundTask.unregisterTaskAsync(identifier);
}
