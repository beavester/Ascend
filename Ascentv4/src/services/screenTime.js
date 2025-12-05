// iOS Screen Time Native Module
// Bridge to Apple's Screen Time API for automatic drain tracking

/**
 * IMPLEMENTATION GUIDE
 * 
 * This module provides the bridge between React Native and Apple's Screen Time API.
 * Due to iOS privacy restrictions, Screen Time data requires:
 * 
 * 1. Family Sharing setup (for DeviceActivityMonitor)
 * 2. User authorization via FamilyControls framework
 * 3. App Group configuration for data sharing
 * 
 * The simpler approach uses the DeviceActivity framework available since iOS 15.
 */

// ═══════════════════════════════════════════════════════════════
// SWIFT NATIVE MODULE (for ios/Ascent/ScreenTimeModule.swift)
// ═══════════════════════════════════════════════════════════════

const SWIFT_MODULE_CODE = `
import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
    
    // Authorization center
    let authorizationCenter = AuthorizationCenter.shared
    
    // MARK: - Authorization
    
    @objc
    func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                try await authorizationCenter.requestAuthorization(for: .individual)
                resolve(["authorized": true])
            } catch {
                reject("AUTH_ERROR", "Screen Time authorization failed", error)
            }
        }
    }
    
    @objc
    func checkAuthorizationStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        let status = authorizationCenter.authorizationStatus
        
        switch status {
        case .notDetermined:
            resolve(["status": "notDetermined"])
        case .denied:
            resolve(["status": "denied"])
        case .approved:
            resolve(["status": "approved"])
        @unknown default:
            resolve(["status": "unknown"])
        }
    }
    
    // MARK: - Screen Time Data
    
    @objc
    func getScreenTimeReport(_ startDate: String,
                             endDate: String,
                             resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Note: Direct screen time reading requires DeviceActivityReport
        // which is only available in App Extensions, not the main app
        
        // For main app usage, we need to use the DeviceActivityMonitor
        // to track in real-time and store to shared UserDefaults/App Group
        
        let sharedDefaults = UserDefaults(suiteName: "group.com.ascent.app")
        
        if let screenTimeData = sharedDefaults?.dictionary(forKey: "screenTimeData") {
            resolve(screenTimeData)
        } else {
            resolve(["error": "No screen time data available"])
        }
    }
    
    // MARK: - App Categories
    
    @objc
    func categorizeApps(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Return predefined app categories for drain calculation
        let categories: [String: Any] = [
            "drainApps": [
                "social": ["com.twitter", "com.instagram", "com.tiktok", "com.facebook"],
                "video": ["com.youtube", "com.netflix", "com.hulu"],
                "gaming": ["games category"]
            ],
            "rechargeApps": [
                "meditation": ["com.headspace", "com.calm"],
                "fitness": ["com.nike.nrc", "com.strava"]
            ],
            "neutralApps": [
                "productivity": ["com.apple.mail", "com.slack"],
                "utilities": ["com.apple.mobilesafari"]
            ]
        ]
        resolve(categories)
    }
    
    // MARK: - Bridge Configuration
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// OBJECTIVE-C BRIDGE (for ios/Ascent/ScreenTimeModule.m)
// ═══════════════════════════════════════════════════════════════

const OBJC_BRIDGE_CODE = `
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ScreenTimeModule, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(checkAuthorizationStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getScreenTimeReport:(NSString *)startDate
                  endDate:(NSString *)endDate
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(categorizeApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

// ═══════════════════════════════════════════════════════════════
// DEVICE ACTIVITY EXTENSION (for real-time monitoring)
// ═══════════════════════════════════════════════════════════════

const DEVICE_ACTIVITY_EXTENSION = `
import DeviceActivity
import ManagedSettings
import FamilyControls

// Extension must be a separate target in Xcode
class AscentDeviceActivityMonitor: DeviceActivityMonitor {
    
    let store = ManagedSettingsStore()
    let sharedDefaults = UserDefaults(suiteName: "group.com.ascent.app")
    
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        // Start of monitoring period (e.g., daily)
        resetDailyTracking()
    }
    
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // End of monitoring period
        saveDailyReport()
    }
    
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, 
                                         activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        
        // Triggered when usage hits a threshold
        // Can send notification to user about drain
        updateDrainTracking(event: event)
    }
    
    private func resetDailyTracking() {
        sharedDefaults?.set([:], forKey: "todayScreenTime")
        sharedDefaults?.set(Date().timeIntervalSince1970, forKey: "trackingStarted")
    }
    
    private func saveDailyReport() {
        guard let todayData = sharedDefaults?.dictionary(forKey: "todayScreenTime") else { return }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateKey = dateFormatter.string(from: Date())
        
        var history = sharedDefaults?.dictionary(forKey: "screenTimeHistory") ?? [:]
        history[dateKey] = todayData
        
        // Keep last 90 days
        let sortedKeys = history.keys.sorted().suffix(90)
        let filteredHistory = history.filter { sortedKeys.contains($0.key) }
        
        sharedDefaults?.set(filteredHistory, forKey: "screenTimeHistory")
    }
    
    private func updateDrainTracking(event: DeviceActivityEvent.Name) {
        var todayData = sharedDefaults?.dictionary(forKey: "todayScreenTime") as? [String: Int] ?? [:]
        
        let eventName = event.rawValue
        todayData[eventName] = (todayData[eventName] ?? 0) + 5 // 5 min increments
        
        sharedDefaults?.set(todayData, forKey: "todayScreenTime")
        
        // Calculate total drain
        let drainApps = ["twitter", "instagram", "tiktok", "youtube", "reddit"]
        let drainMinutes = todayData.filter { key, _ in
            drainApps.contains { key.lowercased().contains($0) }
        }.values.reduce(0, +)
        
        sharedDefaults?.set(drainMinutes, forKey: "todayDrainMinutes")
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// REACT NATIVE JAVASCRIPT BRIDGE
// ═══════════════════════════════════════════════════════════════

import { NativeModules, Platform } from 'react-native';

const { ScreenTimeModule } = NativeModules;

/**
 * Check if Screen Time is available on this device
 */
export const isScreenTimeAvailable = () => {
  return Platform.OS === 'ios' && Platform.Version >= 15 && ScreenTimeModule != null;
};

/**
 * Request Screen Time authorization from the user
 */
export const requestScreenTimeAuthorization = async () => {
  if (!isScreenTimeAvailable()) {
    return { success: false, error: 'Screen Time not available on this device' };
  }
  
  try {
    const result = await ScreenTimeModule.requestAuthorization();
    return { success: result.authorized, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check current authorization status
 */
export const getScreenTimeAuthStatus = async () => {
  if (!isScreenTimeAvailable()) {
    return 'unavailable';
  }
  
  try {
    const result = await ScreenTimeModule.checkAuthorizationStatus();
    return result.status;
  } catch (error) {
    return 'error';
  }
};

/**
 * Get screen time data for a date range
 */
export const getScreenTimeData = async (startDate, endDate) => {
  if (!isScreenTimeAvailable()) {
    return null;
  }
  
  try {
    const data = await ScreenTimeModule.getScreenTimeReport(
      startDate.toISOString(),
      endDate.toISOString()
    );
    return data;
  } catch (error) {
    console.error('Failed to get screen time data:', error);
    return null;
  }
};

/**
 * Convert screen time data to drain metrics
 */
export const calculateDrainFromScreenTime = (screenTimeData) => {
  if (!screenTimeData || screenTimeData.error) {
    return { totalDrain: 0, breakdown: {} };
  }
  
  const drainRates = {
    social: -1.5,   // % per minute
    video: -0.8,
    gaming: -0.5,
    communication: -0.3,
    productivity: 0,
    utility: 0,
  };
  
  let totalDrain = 0;
  const breakdown = {};
  
  for (const [category, minutes] of Object.entries(screenTimeData)) {
    const rate = drainRates[category] || 0;
    const drain = minutes * rate;
    
    if (drain !== 0) {
      breakdown[category] = {
        minutes,
        drain: Math.round(drain),
      };
      totalDrain += drain;
    }
  }
  
  return {
    totalDrain: Math.round(totalDrain),
    breakdown,
    timestamp: Date.now(),
  };
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK: MANUAL TRACKING (when native API unavailable)
// ═══════════════════════════════════════════════════════════════

/**
 * For devices without Screen Time API access,
 * provide manual tracking interface
 */
export const manualScreenTimeEntry = (appName, minutes, category) => {
  return {
    appName,
    minutes,
    category,
    drain: calculateDrainForCategory(category, minutes),
    timestamp: Date.now(),
    source: 'manual',
  };
};

const calculateDrainForCategory = (category, minutes) => {
  const rates = {
    social: -1.5,
    video: -0.8,
    gaming: -0.5,
    news: -1.0,
    communication: -0.3,
    productivity: 0,
    utility: 0,
  };
  
  return Math.round((rates[category] || 0) * minutes);
};

// ═══════════════════════════════════════════════════════════════
// SETUP INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════

export const SETUP_INSTRUCTIONS = `
# iOS Screen Time Integration Setup

## 1. Enable Family Controls Capability

In Xcode:
1. Select your app target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Family Controls"

## 2. Add App Group

1. In Signing & Capabilities, add "App Groups"
2. Create group: "group.com.ascent.app"
3. Enable for both main app and extension

## 3. Create Device Activity Monitor Extension

1. File → New → Target
2. Choose "Device Activity Monitor Extension"
3. Name it "AscentDeviceActivityMonitor"
4. Add to same App Group

## 4. Add Native Module Files

Create in ios/Ascent/:
- ScreenTimeModule.swift (Swift module code above)
- ScreenTimeModule.m (Objective-C bridge above)

## 5. Update Info.plist

Add:
<key>NSFamilyControlsUsageDescription</key>
<string>Ascent tracks screen time to help you understand your energy patterns.</string>

## 6. Request Authorization

Call requestScreenTimeAuthorization() when user first enables the pool feature.

## Limitations

- Screen Time API requires iOS 15+
- User must authorize via FamilyControls
- Detailed app-level data requires Device Activity Extension
- Extensions run in separate process with limited memory
- Data shared via App Groups/UserDefaults

## Alternative: Health App Integration

For simpler integration, can also use HealthKit to read:
- Mindfulness minutes (meditation apps)
- Exercise minutes
- Sleep data

This provides recharge tracking without Screen Time complexity.
`;

export default {
  isScreenTimeAvailable,
  requestScreenTimeAuthorization,
  getScreenTimeAuthStatus,
  getScreenTimeData,
  calculateDrainFromScreenTime,
  manualScreenTimeEntry,
  SETUP_INSTRUCTIONS,
};
