export interface CapabilityManifest {
  api_connector: boolean;
  cloud_ai: boolean;
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  notifications: boolean;
  fileSystem: boolean;
  localAI: boolean;
  ollama: boolean;
  shell: boolean;
  backgroundProcess: boolean;
  systemTray: boolean;
  nativeNotify: boolean;
  browserProfileBridge: boolean;
  pushNotify: boolean;
  biometric: boolean;
  camera_mobile: boolean;
  authBrowserSession: boolean;
  domAccess: boolean;
  headlessBrowser: boolean;
}

interface ElectronCapabilities {
  localFiles: boolean;
  ollama: boolean;
  localAI: boolean;
  ollamaModels: string[];
  shell: boolean;
  browserProfileBridge: boolean;
  backgroundJobs: boolean;
  systemTray: boolean;
  nativeNotify: boolean;
}

declare global {
  interface Window {
    electron?: {
      capabilities: ElectronCapabilities;
    };
  }
}

async function checkPermission(name: PermissionName): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions) return false;
  try {
    const result = await navigator.permissions.query({ name });
    return result.state === 'granted';
  } catch {
    return false;
  }
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electron);
}

function isExtensionContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { chrome?: { runtime?: unknown } }).chrome?.runtime !== 'undefined'
  );
}

function isMobileContext(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android/i.test(navigator.userAgent);
}

export async function detectCapabilities(): Promise<CapabilityManifest> {
  const electron = isElectron() ? window.electron!.capabilities : null;
  const isMobile = isMobileContext();
  const isExtension = isExtensionContext();

  const [cameraGranted, micGranted, geoGranted, notifyGranted] = await Promise.all([
    checkPermission('camera' as PermissionName),
    checkPermission('microphone' as PermissionName),
    checkPermission('geolocation' as PermissionName),
    checkPermission('notifications' as PermissionName)
  ]);

  const hasFileSystemAccessAPI =
    !electron && typeof window !== 'undefined' && 'showOpenFilePicker' in window;

  return {
    api_connector: true,
    cloud_ai: true,
    camera: electron ? false : cameraGranted,
    microphone: micGranted,
    geolocation: geoGranted,
    notifications: notifyGranted,
    fileSystem: electron ? electron.localFiles : hasFileSystemAccessAPI,
    localAI: electron ? electron.localAI : false,
    ollama: electron ? electron.ollama : false,
    shell: electron ? electron.shell : false,
    backgroundProcess: electron ? electron.backgroundJobs : false,
    systemTray: electron ? electron.systemTray : false,
    nativeNotify: electron ? electron.nativeNotify : false,
    browserProfileBridge: electron ? electron.browserProfileBridge : false,
    pushNotify: isMobile && notifyGranted,
    biometric: isMobile && typeof window !== 'undefined' && 'PublicKeyCredential' in window,
    camera_mobile: isMobile && cameraGranted,
    authBrowserSession: isExtension,
    domAccess: isExtension,
    headlessBrowser: false
  };
}

export function capabilityManifestToPayload(manifest: CapabilityManifest): Record<string, boolean> {
  return {
    local_files: manifest.fileSystem,
    local_ai: manifest.localAI,
    ollama: manifest.ollama,
    shell: manifest.shell,
    background_jobs: manifest.backgroundProcess,
    system_tray: manifest.systemTray,
    native_notify: manifest.nativeNotify,
    browser_profile_bridge: manifest.browserProfileBridge,
    camera: manifest.camera || manifest.camera_mobile,
    microphone: manifest.microphone,
    geolocation: manifest.geolocation,
    push_notify: manifest.pushNotify,
    biometric: manifest.biometric,
    auth_browser_session: manifest.authBrowserSession,
    dom_access: manifest.domAccess,
    headless_browser: manifest.headlessBrowser,
    api_connector: manifest.api_connector,
    cloud_ai: manifest.cloud_ai,
    notifications: manifest.notifications
  };
}
