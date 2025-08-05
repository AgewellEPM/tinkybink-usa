// Device Integration Service - Module 44
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getSpeechService } from '../core/speech-service';
import { getHapticService } from '../ui/haptic-service';

interface Device {
  id: string;
  name: string;
  type: 'switch' | 'eyetracker' | 'touch' | 'joystick' | 'sip-puff' | 'headmouse' | 'brainwave' | 'emg';
  manufacturer: string;
  model: string;
  status: 'connected' | 'disconnected' | 'pairing' | 'error';
  capabilities: string[];
  settings: Record<string, any>;
  lastConnected?: Date;
  batteryLevel?: number;
  firmwareVersion?: string;
}

interface SwitchDevice extends Device {
  type: 'switch';
  switches: SwitchConfig[];
  scanSettings: {
    mode: 'automatic' | 'step' | 'inverse';
    speed: number; // ms between highlights
    loops: number;
    firstDelay: number;
    soundFeedback: boolean;
    visualFeedback: boolean;
  };
}

interface SwitchConfig {
  id: string;
  name: string;
  action: 'select' | 'next' | 'previous' | 'back' | 'clear' | 'speak';
  keyBinding?: string;
  enabled: boolean;
}

interface EyeTracker extends Device {
  type: 'eyetracker';
  calibration: {
    points: CalibrationPoint[];
    accuracy: number;
    lastCalibrated?: Date;
  };
  dwellSettings: {
    dwellTime: number; // ms
    dwellRadius: number; // pixels
    showFeedback: boolean;
  };
  gazeSmoothing: number;
}

interface CalibrationPoint {
  x: number;
  y: number;
  samples: number;
  accuracy: number;
}

interface JoystickDevice extends Device {
  type: 'joystick';
  axes: {
    x: { min: number; max: number; deadzone: number; };
    y: { min: number; max: number; deadzone: number; };
  };
  buttons: Array<{
    id: number;
    action: string;
    enabled: boolean;
  }>;
  sensitivity: number;
}

interface DeviceEvent {
  deviceId: string;
  type: 'input' | 'status' | 'battery' | 'error';
  data: any;
  timestamp: number;
}

export class DeviceIntegrationService {
  private static instance: DeviceIntegrationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private speechService = getSpeechService();
  private hapticService = getHapticService();
  
  private devices: Map<string, Device> = new Map();
  private activeDevice: Device | null = null;
  private deviceHandlers: Map<string, (event: DeviceEvent) => void> = new Map();
  private scanningActive: boolean = false;
  private scanningInterval: number | null = null;
  private currentScanIndex: number = 0;
  private calibrationMode: boolean = false;

  private constructor() {
    this.initializeDeviceSupport();
  }

  static getInstance(): DeviceIntegrationService {
    if (!DeviceIntegrationService.instance) {
      DeviceIntegrationService.instance = new DeviceIntegrationService();
    }
    return DeviceIntegrationService.instance;
  }

  initialize(): void {
    console.log('DeviceIntegrationService initializing...');
    this.loadSavedDevices();
    this.setupEventListeners();
    this.startDeviceDiscovery();
    console.log('DeviceIntegrationService initialized');
  }

  private initializeDeviceSupport(): void {
    // Register device handlers
    this.registerDeviceHandler('switch', this.handleSwitchInput.bind(this));
    this.registerDeviceHandler('eyetracker', this.handleEyeTrackerInput.bind(this));
    this.registerDeviceHandler('joystick', this.handleJoystickInput.bind(this));
    this.registerDeviceHandler('touch', this.handleTouchInput.bind(this));
    this.registerDeviceHandler('sip-puff', this.handleSipPuffInput.bind(this));
    this.registerDeviceHandler('headmouse', this.handleHeadMouseInput.bind(this));
    this.registerDeviceHandler('brainwave', this.handleBrainwaveInput.bind(this));
    this.registerDeviceHandler('emg', this.handleEMGInput.bind(this));
  }

  private registerDeviceHandler(type: string, handler: (event: DeviceEvent) => void): void {
    this.deviceHandlers.set(type, handler);
  }

  private setupEventListeners(): void {
    // WebHID API for switches and other HID devices
    if ('hid' in navigator) {
      (navigator as any).hid.addEventListener('connect', this.onHIDConnect.bind(this));
      (navigator as any).hid.addEventListener('disconnect', this.onHIDDisconnect.bind(this));
    }

    // WebUSB API for USB devices
    if ('usb' in navigator) {
      (navigator as any).usb.addEventListener('connect', this.onUSBConnect.bind(this));
      (navigator as any).usb.addEventListener('disconnect', this.onUSBDisconnect.bind(this));
    }

    // Bluetooth API for wireless devices
    if ('bluetooth' in navigator) {
      // Bluetooth events are handled per device connection
    }

    // Gamepad API for joysticks
    window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));

    // Keyboard events for switch emulation
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // Touch events
    window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });

    // Eye tracking (if available)
    if ('eyetracker' in navigator) {
      this.setupEyeTracking();
    }
  }

  private async startDeviceDiscovery(): Promise<void> {
    // Auto-discover available devices
    await this.discoverHIDDevices();
    await this.discoverUSBDevices();
    await this.discoverBluetoothDevices();
    this.checkGamepads();
  }

  // Device discovery methods
  private async discoverHIDDevices(): Promise<void> {
    if (!('hid' in navigator)) return;

    try {
      const devices = await (navigator as any).hid.getDevices();
      devices.forEach((device: any) => {
        if (this.isSupportedHIDDevice(device)) {
          this.addDevice({
            id: `hid-${device.vendorId}-${device.productId}`,
            name: device.productName || 'HID Device',
            type: 'switch',
            manufacturer: device.manufacturerName || 'Unknown',
            model: device.productName || 'Unknown',
            status: 'disconnected',
            capabilities: ['switch', 'button'],
            settings: {}
          });
        }
      });
    } catch (error) {
      console.error('Failed to discover HID devices:', error);
    }
  }

  private async discoverUSBDevices(): Promise<void> {
    if (!('usb' in navigator)) return;

    try {
      const devices = await (navigator as any).usb.getDevices();
      devices.forEach((device: any) => {
        if (this.isSupportedUSBDevice(device)) {
          this.addDevice({
            id: `usb-${device.vendorId}-${device.productId}`,
            name: device.productName || 'USB Device',
            type: this.getUSBDeviceType(device),
            manufacturer: device.manufacturerName || 'Unknown',
            model: device.productName || 'Unknown',
            status: 'disconnected',
            capabilities: this.getUSBDeviceCapabilities(device),
            settings: {}
          });
        }
      });
    } catch (error) {
      console.error('Failed to discover USB devices:', error);
    }
  }

  private async discoverBluetoothDevices(): Promise<void> {
    // Bluetooth discovery requires user action
    // This will be triggered by user request
  }

  private checkGamepads(): void {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.addDevice({
          id: `gamepad-${gamepad.index}`,
          name: gamepad.id,
          type: 'joystick',
          manufacturer: 'Unknown',
          model: gamepad.id,
          status: 'connected',
          capabilities: ['joystick', 'buttons'],
          settings: {
            axes: gamepad.axes.length,
            buttons: gamepad.buttons.length
          }
        } as JoystickDevice);
      }
    }
  }

  // Device connection methods
  async connectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    try {
      device.status = 'pairing';
      
      switch (device.type) {
        case 'switch':
          await this.connectSwitchDevice(device);
          break;
        case 'eyetracker':
          await this.connectEyeTracker(device);
          break;
        case 'joystick':
          await this.connectJoystick(device);
          break;
        case 'sip-puff':
          await this.connectSipPuff(device);
          break;
        case 'headmouse':
          await this.connectHeadMouse(device);
          break;
        case 'brainwave':
          await this.connectBrainwave(device);
          break;
        case 'emg':
          await this.connectEMG(device);
          break;
      }

      device.status = 'connected';
      device.lastConnected = new Date();
      this.activeDevice = device;

      this.saveDeviceSettings(device);
      this.analyticsService.trackEvent('device_connected', {
        deviceType: device.type,
        deviceId: device.id
      });

      return true;
    } catch (error) {
      console.error('Failed to connect device:', error);
      device.status = 'error';
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // Device-specific disconnection
    switch (device.type) {
      case 'switch':
        this.stopScanning();
        break;
      case 'eyetracker':
        this.stopEyeTracking();
        break;
    }

    device.status = 'disconnected';
    if (this.activeDevice?.id === deviceId) {
      this.activeDevice = null;
    }

    this.analyticsService.trackEvent('device_disconnected', {
      deviceType: device.type,
      deviceId: device.id
    });
  }

  // Switch scanning methods
  startScanning(options?: {
    mode?: 'automatic' | 'step' | 'inverse';
    speed?: number;
    pattern?: 'linear' | 'row-column' | 'block';
  }): void {
    if (!this.activeDevice || this.activeDevice.type !== 'switch') return;

    const switchDevice = this.activeDevice as SwitchDevice;
    const settings = switchDevice.scanSettings;

    // Apply options if provided
    if (options) {
      Object.assign(settings, options);
    }

    this.scanningActive = true;
    this.currentScanIndex = 0;

    if (settings.mode === 'automatic') {
      this.startAutomaticScanning(settings.speed);
    }

    this.analyticsService.trackEvent('scanning_started', {
      mode: settings.mode,
      speed: settings.speed
    });
  }

  private startAutomaticScanning(speed: number): void {
    const scanTargets = this.getScanTargets();
    
    this.scanningInterval = window.setInterval(() => {
      if (!this.scanningActive) {
        this.stopScanning();
        return;
      }

      // Remove highlight from previous target
      this.unhighlightTarget(scanTargets[this.currentScanIndex]);

      // Move to next target
      this.currentScanIndex = (this.currentScanIndex + 1) % scanTargets.length;

      // Highlight current target
      this.highlightTarget(scanTargets[this.currentScanIndex]);

      // Sound feedback
      const switchDevice = this.activeDevice as SwitchDevice;
      if (switchDevice.scanSettings.soundFeedback) {
        this.playSound('scan');
      }
    }, speed);
  }

  stopScanning(): void {
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
      this.scanningInterval = null;
    }

    this.scanningActive = false;
    
    // Remove all highlights
    const scanTargets = this.getScanTargets();
    scanTargets.forEach(target => this.unhighlightTarget(target));
  }

  // Eye tracking methods
  private async connectEyeTracker(device: Device): Promise<void> {
    const tracker = device as EyeTracker;
    
    // Initialize eye tracking API
    if ('eyetracker' in navigator) {
      const eyetracker = (navigator as any).eyetracker;
      await eyetracker.requestPermission();
      
      // Start tracking
      eyetracker.addEventListener('gazeupdated', (event: any) => {
        this.handleEyeTrackerInput({
          deviceId: device.id,
          type: 'input',
          data: {
            x: event.x,
            y: event.y,
            confidence: event.confidence
          },
          timestamp: Date.now()
        });
      });
    }
  }

  private stopEyeTracking(): void {
    if ('eyetracker' in navigator) {
      const eyetracker = (navigator as any).eyetracker;
      eyetracker.stop();
    }
  }

  async calibrateEyeTracker(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId) as EyeTracker;
    if (!device || device.type !== 'eyetracker') return false;

    this.calibrationMode = true;
    const calibrationPoints = this.generateCalibrationPoints();
    const results: CalibrationPoint[] = [];

    try {
      for (const point of calibrationPoints) {
        // Show calibration target
        this.showCalibrationTarget(point);
        
        // Collect samples
        const samples = await this.collectCalibrationSamples(point, 50);
        
        results.push({
          x: point.x,
          y: point.y,
          samples: samples.length,
          accuracy: this.calculateAccuracy(samples, point)
        });
      }

      // Update calibration
      device.calibration = {
        points: results,
        accuracy: results.reduce((sum, p) => sum + p.accuracy, 0) / results.length,
        lastCalibrated: new Date()
      };

      this.calibrationMode = false;
      this.hideCalibrationTarget();

      this.saveDeviceSettings(device);
      return true;
    } catch (error) {
      console.error('Calibration failed:', error);
      this.calibrationMode = false;
      return false;
    }
  }

  // Input handling methods
  private handleSwitchInput(event: DeviceEvent): void {
    if (!this.scanningActive) return;

    const switchDevice = this.activeDevice as SwitchDevice;
    const switchConfig = switchDevice.switches.find(s => s.id === event.data.switchId);
    
    if (!switchConfig || !switchConfig.enabled) return;

    switch (switchConfig.action) {
      case 'select':
        this.selectCurrentTarget();
        break;
      case 'next':
        this.moveToNextTarget();
        break;
      case 'previous':
        this.moveToPreviousTarget();
        break;
      case 'back':
        this.goBack();
        break;
      case 'clear':
        this.clearSelection();
        break;
      case 'speak':
        this.speakSelection();
        break;
    }

    this.hapticService.vibrate('light');
  }

  private handleEyeTrackerInput(event: DeviceEvent): void {
    const tracker = this.activeDevice as EyeTracker;
    if (!tracker) return;

    const { x, y, confidence } = event.data;
    
    // Apply gaze smoothing
    const smoothedPoint = this.smoothGazePoint({ x, y }, tracker.gazeSmoothing);
    
    // Check for dwell
    const target = this.getTargetAtPoint(smoothedPoint);
    if (target) {
      this.updateDwellProgress(target, tracker.dwellSettings);
    }

    // Update gaze cursor
    this.updateGazeCursor(smoothedPoint, confidence);
  }

  private handleJoystickInput(event: DeviceEvent): void {
    const joystick = this.activeDevice as JoystickDevice;
    if (!joystick) return;

    if (event.data.type === 'axis') {
      // Handle axis movement
      const { axis, value } = event.data;
      const axisConfig = axis === 0 ? joystick.axes.x : joystick.axes.y;
      
      // Apply deadzone
      const adjustedValue = Math.abs(value) < axisConfig.deadzone ? 0 : value;
      
      if (adjustedValue !== 0) {
        this.handleJoystickMovement(axis, adjustedValue * joystick.sensitivity);
      }
    } else if (event.data.type === 'button') {
      // Handle button press
      const button = joystick.buttons.find(b => b.id === event.data.buttonId);
      if (button && button.enabled) {
        this.executeAction(button.action);
      }
    }
  }

  private handleTouchInput(event: DeviceEvent): void {
    // Process touch events for accessibility
    const { type, touches } = event.data;
    
    switch (type) {
      case 'tap':
        this.handleTap(touches[0]);
        break;
      case 'doubletap':
        this.handleDoubleTap(touches[0]);
        break;
      case 'swipe':
        this.handleSwipe(event.data.direction);
        break;
      case 'pinch':
        this.handlePinch(event.data.scale);
        break;
    }
  }

  private handleSipPuffInput(event: DeviceEvent): void {
    const { type, strength, duration } = event.data;
    
    if (type === 'sip') {
      if (duration < 500) {
        this.executeAction('select');
      } else {
        this.executeAction('back');
      }
    } else if (type === 'puff') {
      if (strength > 0.7) {
        this.executeAction('clear');
      } else {
        this.executeAction('next');
      }
    }
  }

  private handleHeadMouseInput(event: DeviceEvent): void {
    const { x, y, click } = event.data;
    
    // Update cursor position
    this.updateCursor({ x, y });
    
    if (click) {
      const target = this.getTargetAtPoint({ x, y });
      if (target) {
        this.selectTarget(target);
      }
    }
  }

  private handleBrainwaveInput(event: DeviceEvent): void {
    const { signal, strength } = event.data;
    
    // Map brainwave signals to actions
    switch (signal) {
      case 'focus':
        if (strength > 0.8) {
          this.executeAction('select');
        }
        break;
      case 'relax':
        if (strength > 0.7) {
          this.executeAction('back');
        }
        break;
    }
  }

  private handleEMGInput(event: DeviceEvent): void {
    const { muscle, activation } = event.data;
    
    // Map muscle activations to actions
    if (activation > 0.6) {
      switch (muscle) {
        case 'bicep':
          this.executeAction('select');
          break;
        case 'forearm':
          this.executeAction('next');
          break;
      }
    }
  }

  // Helper methods
  private getScanTargets(): HTMLElement[] {
    // Get all scannable elements
    const tiles = Array.from(document.querySelectorAll('.tile-button'));
    const buttons = Array.from(document.querySelectorAll('button:not(:disabled)'));
    const links = Array.from(document.querySelectorAll('a[href]'));
    
    return [...tiles, ...buttons, ...links] as HTMLElement[];
  }

  private highlightTarget(target: HTMLElement): void {
    target.classList.add('scan-highlight');
    target.setAttribute('aria-selected', 'true');
  }

  private unhighlightTarget(target: HTMLElement): void {
    target.classList.remove('scan-highlight');
    target.setAttribute('aria-selected', 'false');
  }

  private selectCurrentTarget(): void {
    const targets = this.getScanTargets();
    const currentTarget = targets[this.currentScanIndex];
    
    if (currentTarget) {
      currentTarget.click();
      this.stopScanning();
      
      // Restart scanning after a delay
      setTimeout(() => {
        if (this.activeDevice?.type === 'switch') {
          this.startScanning();
        }
      }, 1000);
    }
  }

  private moveToNextTarget(): void {
    const targets = this.getScanTargets();
    this.unhighlightTarget(targets[this.currentScanIndex]);
    this.currentScanIndex = (this.currentScanIndex + 1) % targets.length;
    this.highlightTarget(targets[this.currentScanIndex]);
  }

  private moveToPreviousTarget(): void {
    const targets = this.getScanTargets();
    this.unhighlightTarget(targets[this.currentScanIndex]);
    this.currentScanIndex = (this.currentScanIndex - 1 + targets.length) % targets.length;
    this.highlightTarget(targets[this.currentScanIndex]);
  }

  private executeAction(action: string): void {
    switch (action) {
      case 'select':
        this.selectCurrentTarget();
        break;
      case 'next':
        this.moveToNextTarget();
        break;
      case 'previous':
        this.moveToPreviousTarget();
        break;
      case 'back':
        this.goBack();
        break;
      case 'clear':
        this.clearSelection();
        break;
      case 'speak':
        this.speakSelection();
        break;
      default:
        // Custom action
        window.dispatchEvent(new CustomEvent('deviceAction', {
          detail: { action }
        }));
    }
  }

  private goBack(): void {
    window.dispatchEvent(new CustomEvent('navigateBack'));
  }

  private clearSelection(): void {
    window.dispatchEvent(new CustomEvent('clearSentence'));
  }

  private speakSelection(): void {
    window.dispatchEvent(new CustomEvent('speakSentence'));
  }

  private getTargetAtPoint(point: { x: number; y: number }): HTMLElement | null {
    const element = document.elementFromPoint(point.x, point.y);
    if (!element) return null;
    
    // Find clickable parent
    let target = element as HTMLElement;
    while (target && !this.isClickable(target)) {
      target = target.parentElement as HTMLElement;
    }
    
    return target;
  }

  private isClickable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'button' || 
           tagName === 'a' ||
           element.classList.contains('tile-button') ||
           element.getAttribute('role') === 'button' ||
           element.onclick !== null;
  }

  private selectTarget(target: HTMLElement): void {
    target.click();
    this.hapticService.vibrate('light');
  }

  private smoothGazePoint(point: { x: number; y: number }, smoothing: number): { x: number; y: number } {
    // Simple exponential smoothing
    const lastPoint = this.dataService.getData('last_gaze_point') || point;
    const smoothed = {
      x: lastPoint.x + (point.x - lastPoint.x) * (1 - smoothing),
      y: lastPoint.y + (point.y - lastPoint.y) * (1 - smoothing)
    };
    
    this.dataService.setData('last_gaze_point', smoothed);
    return smoothed;
  }

  private updateDwellProgress(target: HTMLElement, settings: any): void {
    const dwellData = this.dataService.getData('dwell_data') || {};
    const targetId = this.getTargetId(target);
    
    if (!dwellData[targetId]) {
      dwellData[targetId] = {
        startTime: Date.now(),
        progress: 0
      };
    }
    
    const elapsed = Date.now() - dwellData[targetId].startTime;
    const progress = Math.min(elapsed / settings.dwellTime, 1);
    
    dwellData[targetId].progress = progress;
    
    if (progress >= 1) {
      // Dwell complete
      this.selectTarget(target);
      delete dwellData[targetId];
    } else if (settings.showFeedback) {
      // Show dwell progress
      this.showDwellProgress(target, progress);
    }
    
    this.dataService.setData('dwell_data', dwellData);
  }

  private getTargetId(element: HTMLElement): string {
    return element.id || element.className || element.tagName;
  }

  private showDwellProgress(target: HTMLElement, progress: number): void {
    // Show visual feedback for dwell progress
    let indicator = target.querySelector('.dwell-indicator') as HTMLElement;
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'dwell-indicator';
      target.appendChild(indicator);
    }
    
    indicator.style.transform = `scale(${progress})`;
    indicator.style.opacity = String(progress);
  }

  private updateGazeCursor(point: { x: number; y: number }, confidence: number): void {
    let cursor = document.getElementById('gaze-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'gaze-cursor';
      cursor.className = 'gaze-cursor';
      document.body.appendChild(cursor);
    }
    
    cursor.style.left = `${point.x}px`;
    cursor.style.top = `${point.y}px`;
    cursor.style.opacity = String(confidence);
  }

  private updateCursor(point: { x: number; y: number }): void {
    // Update cursor position for head mouse
    const cursor = document.getElementById('device-cursor') || this.createDeviceCursor();
    cursor.style.left = `${point.x}px`;
    cursor.style.top = `${point.y}px`;
  }

  private createDeviceCursor(): HTMLElement {
    const cursor = document.createElement('div');
    cursor.id = 'device-cursor';
    cursor.className = 'device-cursor';
    document.body.appendChild(cursor);
    return cursor;
  }

  private handleJoystickMovement(axis: number, value: number): void {
    // Convert joystick movement to navigation
    if (axis === 0) { // X-axis
      if (value > 0) {
        this.moveToNextTarget();
      } else {
        this.moveToPreviousTarget();
      }
    } else { // Y-axis
      // Could be used for row navigation in grid layouts
    }
  }

  private handleTap(touch: Touch): void {
    const target = this.getTargetAtPoint({ x: touch.clientX, y: touch.clientY });
    if (target) {
      this.selectTarget(target);
    }
  }

  private handleDoubleTap(touch: Touch): void {
    this.speakSelection();
  }

  private handleSwipe(direction: string): void {
    switch (direction) {
      case 'left':
        this.goBack();
        break;
      case 'right':
        this.moveToNextTarget();
        break;
      case 'up':
        this.clearSelection();
        break;
      case 'down':
        this.speakSelection();
        break;
    }
  }

  private handlePinch(scale: number): void {
    // Could be used for zoom functionality
    window.dispatchEvent(new CustomEvent('deviceZoom', {
      detail: { scale }
    }));
  }

  private playSound(type: string): void {
    // Play feedback sounds
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(e => console.log('Sound playback failed:', e));
  }

  // Calibration helpers
  private generateCalibrationPoints(): Array<{ x: number; y: number }> {
    const points = [];
    const margin = 100;
    const width = window.innerWidth - 2 * margin;
    const height = window.innerHeight - 2 * margin;
    
    // 9-point calibration grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        points.push({
          x: margin + (col * width / 2),
          y: margin + (row * height / 2)
        });
      }
    }
    
    return points;
  }

  private showCalibrationTarget(point: { x: number; y: number }): void {
    let target = document.getElementById('calibration-target');
    if (!target) {
      target = document.createElement('div');
      target.id = 'calibration-target';
      target.className = 'calibration-target';
      document.body.appendChild(target);
    }
    
    target.style.left = `${point.x}px`;
    target.style.top = `${point.y}px`;
    target.style.display = 'block';
  }

  private hideCalibrationTarget(): void {
    const target = document.getElementById('calibration-target');
    if (target) {
      target.style.display = 'none';
    }
  }

  private async collectCalibrationSamples(point: { x: number; y: number }, count: number): Promise<Array<{ x: number; y: number }>> {
    const samples = [];
    
    return new Promise((resolve) => {
      let collected = 0;
      const collector = setInterval(() => {
        const gazePoint = this.dataService.getData('last_gaze_point');
        if (gazePoint) {
          samples.push(gazePoint);
          collected++;
        }
        
        if (collected >= count) {
          clearInterval(collector);
          resolve(samples);
        }
      }, 50);
    });
  }

  private calculateAccuracy(samples: Array<{ x: number; y: number }>, target: { x: number; y: number }): number {
    const avgX = samples.reduce((sum, p) => sum + p.x, 0) / samples.length;
    const avgY = samples.reduce((sum, p) => sum + p.y, 0) / samples.length;
    
    const distance = Math.sqrt(Math.pow(avgX - target.x, 2) + Math.pow(avgY - target.y, 2));
    const maxDistance = 50; // pixels
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  // Event handlers
  private onHIDConnect(event: any): void {
    console.log('HID device connected:', event.device);
    this.discoverHIDDevices();
  }

  private onHIDDisconnect(event: any): void {
    console.log('HID device disconnected:', event.device);
    const deviceId = `hid-${event.device.vendorId}-${event.device.productId}`;
    this.removeDevice(deviceId);
  }

  private onUSBConnect(event: any): void {
    console.log('USB device connected:', event.device);
    this.discoverUSBDevices();
  }

  private onUSBDisconnect(event: any): void {
    console.log('USB device disconnected:', event.device);
    const deviceId = `usb-${event.device.vendorId}-${event.device.productId}`;
    this.removeDevice(deviceId);
  }

  private onGamepadConnected(event: GamepadEvent): void {
    console.log('Gamepad connected:', event.gamepad);
    this.checkGamepads();
  }

  private onGamepadDisconnected(event: GamepadEvent): void {
    console.log('Gamepad disconnected:', event.gamepad);
    const deviceId = `gamepad-${event.gamepad.index}`;
    this.removeDevice(deviceId);
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Keyboard switch emulation
    if (!this.activeDevice || this.activeDevice.type !== 'switch') return;
    
    const switchDevice = this.activeDevice as SwitchDevice;
    const switchConfig = switchDevice.switches.find(s => s.keyBinding === event.key);
    
    if (switchConfig) {
      this.handleSwitchInput({
        deviceId: this.activeDevice.id,
        type: 'input',
        data: { switchId: switchConfig.id },
        timestamp: Date.now()
      });
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    // Handle key release if needed
  }

  private onTouchStart(event: TouchEvent): void {
    if (this.activeDevice?.type !== 'touch') return;
    
    this.handleTouchInput({
      deviceId: this.activeDevice.id,
      type: 'input',
      data: {
        type: 'touchstart',
        touches: Array.from(event.touches)
      },
      timestamp: Date.now()
    });
  }

  private onTouchMove(event: TouchEvent): void {
    if (this.activeDevice?.type !== 'touch') return;
    
    // Detect swipe gestures
    // Implementation omitted for brevity
  }

  private onTouchEnd(event: TouchEvent): void {
    if (this.activeDevice?.type !== 'touch') return;
    
    // Detect tap, double tap, etc.
    // Implementation omitted for brevity
  }

  // Device management
  private addDevice(device: Device): void {
    this.devices.set(device.id, device);
    this.saveDevices();
  }

  private removeDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    if (this.activeDevice?.id === deviceId) {
      this.activeDevice = null;
    }
    this.saveDevices();
  }

  private saveDevices(): void {
    const devicesData = Array.from(this.devices.values());
    this.dataService.setData('connected_devices', devicesData);
  }

  private loadSavedDevices(): void {
    const saved = this.dataService.getData('connected_devices') || [];
    saved.forEach((deviceData: Device) => {
      this.devices.set(deviceData.id, deviceData);
    });
  }

  private saveDeviceSettings(device: Device): void {
    this.dataService.setData(`device_settings_${device.id}`, device.settings);
  }

  // Helper methods
  private isSupportedHIDDevice(device: any): boolean {
    // Check if device is a supported switch interface
    const supportedVendors = [0x1234, 0x5678]; // Example vendor IDs
    return supportedVendors.includes(device.vendorId);
  }

  private isSupportedUSBDevice(device: any): boolean {
    // Check if device is supported
    return true; // Simplified
  }

  private getUSBDeviceType(device: any): Device['type'] {
    // Determine device type based on USB class/subclass
    return 'switch'; // Simplified
  }

  private getUSBDeviceCapabilities(device: any): string[] {
    // Determine capabilities based on device descriptors
    return ['switch', 'button']; // Simplified
  }

  private setupEyeTracking(): void {
    // Setup eye tracking if available
    console.log('Eye tracking available');
  }

  private async connectSwitchDevice(device: Device): Promise<void> {
    // Initialize switch device
    const switchDevice = device as SwitchDevice;
    
    // Set default switch configuration if not present
    if (!switchDevice.switches) {
      switchDevice.switches = [
        {
          id: 'switch1',
          name: 'Switch 1',
          action: 'select',
          keyBinding: ' ', // Space bar
          enabled: true
        },
        {
          id: 'switch2',
          name: 'Switch 2',
          action: 'next',
          keyBinding: 'Tab',
          enabled: true
        }
      ];
    }
    
    // Set default scan settings
    if (!switchDevice.scanSettings) {
      switchDevice.scanSettings = {
        mode: 'automatic',
        speed: 1000,
        loops: 3,
        firstDelay: 2000,
        soundFeedback: true,
        visualFeedback: true
      };
    }
  }

  private async connectJoystick(device: Device): Promise<void> {
    // Initialize joystick
    const joystick = device as JoystickDevice;
    
    // Set default configuration
    if (!joystick.axes) {
      joystick.axes = {
        x: { min: -1, max: 1, deadzone: 0.2 },
        y: { min: -1, max: 1, deadzone: 0.2 }
      };
    }
    
    if (!joystick.sensitivity) {
      joystick.sensitivity = 1.0;
    }
    
    // Start polling gamepad
    this.startGamepadPolling(device.id);
  }

  private startGamepadPolling(deviceId: string): void {
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const index = parseInt(deviceId.split('-')[1]);
      const gamepad = gamepads[index];
      
      if (gamepad && this.activeDevice?.id === deviceId) {
        // Check axes
        for (let i = 0; i < gamepad.axes.length; i++) {
          const value = gamepad.axes[i];
          if (Math.abs(value) > 0.1) {
            this.handleJoystickInput({
              deviceId,
              type: 'input',
              data: { type: 'axis', axis: i, value },
              timestamp: Date.now()
            });
          }
        }
        
        // Check buttons
        for (let i = 0; i < gamepad.buttons.length; i++) {
          if (gamepad.buttons[i].pressed) {
            this.handleJoystickInput({
              deviceId,
              type: 'input',
              data: { type: 'button', buttonId: i },
              timestamp: Date.now()
            });
          }
        }
        
        requestAnimationFrame(pollGamepad);
      }
    };
    
    requestAnimationFrame(pollGamepad);
  }

  // Public API
  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getActiveDevice(): Device | null {
    return this.activeDevice;
  }

  getDevice(deviceId: string): Device | null {
    return this.devices.get(deviceId) || null;
  }

  isDeviceConnected(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    return device?.status === 'connected' || false;
  }

  async requestDevice(type: Device['type']): Promise<Device | null> {
    try {
      switch (type) {
        case 'switch':
          if ('hid' in navigator) {
            const devices = await (navigator as any).hid.requestDevice({
              filters: [] // Add specific filters as needed
            });
            if (devices.length > 0) {
              await this.discoverHIDDevices();
              return this.devices.get(`hid-${devices[0].vendorId}-${devices[0].productId}`) || null;
            }
          }
          break;
          
        case 'eyetracker':
          // Request eye tracker permission
          if ('eyetracker' in navigator) {
            await (navigator as any).eyetracker.requestPermission();
            // Create virtual eye tracker device
            const device: EyeTracker = {
              id: 'eyetracker-1',
              name: 'Eye Tracker',
              type: 'eyetracker',
              manufacturer: 'System',
              model: 'Built-in',
              status: 'disconnected',
              capabilities: ['gaze', 'calibration'],
              settings: {},
              calibration: {
                points: [],
                accuracy: 0
              },
              dwellSettings: {
                dwellTime: 1000,
                dwellRadius: 50,
                showFeedback: true
              },
              gazeSmoothing: 0.8
            };
            this.addDevice(device);
            return device;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to request device:', error);
    }
    
    return null;
  }

  updateDeviceSettings(deviceId: string, settings: Partial<Device['settings']>): void {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    Object.assign(device.settings, settings);
    this.saveDeviceSettings(device);
    
    // Apply settings immediately if device is active
    if (this.activeDevice?.id === deviceId) {
      this.applyDeviceSettings(device);
    }
  }

  private applyDeviceSettings(device: Device): void {
    switch (device.type) {
      case 'switch':
        const switchDevice = device as SwitchDevice;
        if (this.scanningActive) {
          this.stopScanning();
          this.startScanning(switchDevice.scanSettings);
        }
        break;
        
      case 'eyetracker':
        // Apply eye tracker settings
        break;
        
      case 'joystick':
        // Apply joystick settings
        break;
    }
  }

  getScanningStatus(): {
    active: boolean;
    mode?: string;
    speed?: number;
    currentIndex: number;
  } {
    if (!this.scanningActive || !this.activeDevice) {
      return { active: false, currentIndex: -1 };
    }
    
    const switchDevice = this.activeDevice as SwitchDevice;
    return {
      active: true,
      mode: switchDevice.scanSettings.mode,
      speed: switchDevice.scanSettings.speed,
      currentIndex: this.currentScanIndex
    };
  }

  isCalibrating(): boolean {
    return this.calibrationMode;
  }
}

export function getDeviceIntegrationService(): DeviceIntegrationService {
  return DeviceIntegrationService.getInstance();
}