// iOS Widget Configuration
// Bridge for sharing data with iOS widgets

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════
// APP GROUP CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const APP_GROUP = 'group.com.ascent.app';

// Widget types
const WIDGET_TYPES = {
  POOL_COMPACT: 'PoolCompactWidget',
  POOL_MEDIUM: 'PoolMediumWidget',
  STREAK_COMPACT: 'StreakCompactWidget',
  TODAY_HABITS: 'TodayHabitsWidget',
};

// ═══════════════════════════════════════════════════════════════
// WIDGET DATA STRUCTURE
// ═══════════════════════════════════════════════════════════════

/**
 * Prepare data for widget consumption
 */
export const prepareWidgetData = (data) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate today's completion status
  const todayCompletions = data.completions?.filter(c => 
    c.date.startsWith(todayStr) && c.completed
  ) || [];
  
  const totalHabits = data.habits?.length || 0;
  const completedToday = todayCompletions.length;
  const completionRate = totalHabits > 0 
    ? Math.round((completedToday / totalHabits) * 100)
    : 0;
  
  // Get incomplete habits for widget
  const incompleteHabits = (data.habits || [])
    .filter(h => !todayCompletions.some(c => c.odHabitId === h.id))
    .slice(0, 3) // Limit for widget space
    .map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji || '📋',
      twoMinVersion: h.twoMinVersion || `Do ${h.name} for 2 minutes`,
    }));
  
  return {
    // Timestamp
    lastUpdated: new Date().toISOString(),
    
    // Pool data
    pool: {
      currentLevel: data.poolData?.currentLevel || 65,
      morningLevel: data.poolData?.morningLevel || 65,
      status: getPoolStatus(data.poolData?.currentLevel || 65),
      color: getPoolColor(data.poolData?.currentLevel || 65),
    },
    
    // Streak data
    streak: {
      current: data.streakDays || 0,
      best: data.bestStreak || data.streakDays || 0,
      consistencyScore: data.consistencyScore || 0,
    },
    
    // Today's progress
    today: {
      completed: completedToday,
      total: totalHabits,
      rate: completionRate,
      remaining: totalHabits - completedToday,
    },
    
    // Quick access habits
    incompleteHabits,
    
    // Goal
    goal: data.goal || '',
    
    // User preference
    userName: data.userName || '',
  };
};

/**
 * Get pool status text
 */
const getPoolStatus = (level) => {
  if (level >= 70) return 'high';
  if (level >= 40) return 'moderate';
  return 'low';
};

/**
 * Get pool color for widget
 */
const getPoolColor = (level) => {
  if (level >= 70) return '#60a5fa'; // Blue
  if (level >= 40) return '#fbbf24'; // Amber
  return '#f87171'; // Red
};

// ═══════════════════════════════════════════════════════════════
// SHARED USER DEFAULTS (iOS)
// ═══════════════════════════════════════════════════════════════

/**
 * Save widget data to shared UserDefaults
 * Note: Requires native module for full implementation
 */
export const saveWidgetData = async (data) => {
  if (Platform.OS !== 'ios') return;
  
  const widgetData = prepareWidgetData(data);
  
  // Save to AsyncStorage as backup
  await AsyncStorage.setItem('widgetData', JSON.stringify(widgetData));
  
  // In full implementation, would call native module:
  // NativeModules.WidgetBridge.saveToAppGroup(APP_GROUP, widgetData);
  
  return widgetData;
};

/**
 * Trigger widget refresh
 */
export const refreshWidgets = async () => {
  if (Platform.OS !== 'ios') return;
  
  // In full implementation:
  // NativeModules.WidgetBridge.reloadAllTimelines();
};

// ═══════════════════════════════════════════════════════════════
// SWIFT WIDGET CODE
// ═══════════════════════════════════════════════════════════════

export const SWIFT_WIDGET_CODE = `
import WidgetKit
import SwiftUI

// MARK: - Widget Data Model

struct AscentWidgetData: Codable {
    let lastUpdated: String
    let pool: PoolData
    let streak: StreakData
    let today: TodayData
    let incompleteHabits: [HabitData]
    let goal: String
    
    struct PoolData: Codable {
        let currentLevel: Int
        let morningLevel: Int
        let status: String
        let color: String
    }
    
    struct StreakData: Codable {
        let current: Int
        let best: Int
        let consistencyScore: Int
    }
    
    struct TodayData: Codable {
        let completed: Int
        let total: Int
        let rate: Int
        let remaining: Int
    }
    
    struct HabitData: Codable {
        let id: String
        let name: String
        let emoji: String
        let twoMinVersion: String
    }
}

// MARK: - Data Provider

struct Provider: TimelineProvider {
    let sharedDefaults = UserDefaults(suiteName: "group.com.ascent.app")
    
    func placeholder(in context: Context) -> AscentEntry {
        AscentEntry(date: Date(), data: sampleData)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (AscentEntry) -> Void) {
        let entry = AscentEntry(date: Date(), data: loadData())
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<AscentEntry>) -> Void) {
        let currentDate = Date()
        let entry = AscentEntry(date: currentDate, data: loadData())
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    func loadData() -> AscentWidgetData {
        guard let jsonString = sharedDefaults?.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8),
              let data = try? JSONDecoder().decode(AscentWidgetData.self, from: jsonData)
        else {
            return sampleData
        }
        return data
    }
    
    var sampleData: AscentWidgetData {
        AscentWidgetData(
            lastUpdated: Date().ISO8601Format(),
            pool: .init(currentLevel: 65, morningLevel: 65, status: "moderate", color: "#fbbf24"),
            streak: .init(current: 7, best: 14, consistencyScore: 75),
            today: .init(completed: 2, total: 4, rate: 50, remaining: 2),
            incompleteHabits: [],
            goal: "Build better habits"
        )
    }
}

struct AscentEntry: TimelineEntry {
    let date: Date
    let data: AscentWidgetData
}

// MARK: - Pool Compact Widget View

struct PoolCompactView: View {
    let data: AscentWidgetData
    
    var poolColor: Color {
        Color(hex: data.pool.color) ?? .blue
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(poolColor)
                Text("\\(data.pool.currentLevel)%")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
            }
            
            Text(data.pool.status.capitalized)
                .font(.caption)
                .foregroundColor(.secondary)
            
            // Mini progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                    RoundedRectangle(cornerRadius: 4)
                        .fill(poolColor)
                        .frame(width: geo.size.width * CGFloat(data.pool.currentLevel) / 100)
                }
            }
            .frame(height: 6)
        }
        .padding()
    }
}

// MARK: - Streak Widget View

struct StreakCompactView: View {
    let data: AscentWidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("🔥")
                Text("\\(data.streak.current)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                Text("days")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Text("\\(data.today.completed)/\\(data.today.total)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text("today")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            // Today's progress
            HStack(spacing: 2) {
                ForEach(0..<data.today.total, id: \\.self) { i in
                    Circle()
                        .fill(i < data.today.completed ? Color.green : Color.gray.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }
        }
        .padding()
    }
}

// MARK: - Today Habits Widget

struct TodayHabitsView: View {
    let data: AscentWidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Today")
                    .font(.headline)
                Spacer()
                Text("\\(data.today.completed)/\\(data.today.total)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            if data.incompleteHabits.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("All done!")
                        .foregroundColor(.secondary)
                }
            } else {
                ForEach(data.incompleteHabits, id: \\.id) { habit in
                    HStack {
                        Text(habit.emoji)
                        Text(habit.name)
                            .lineLimit(1)
                        Spacer()
                        Image(systemName: "circle")
                            .foregroundColor(.gray)
                    }
                    .font(.subheadline)
                }
            }
        }
        .padding()
    }
}

// MARK: - Widget Configuration

@main
struct AscentWidgets: WidgetBundle {
    var body: some Widget {
        PoolWidget()
        StreakWidget()
        TodayWidget()
    }
}

struct PoolWidget: Widget {
    let kind = "PoolCompactWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PoolCompactView(data: entry.data)
        }
        .configurationDisplayName("Drive Pool")
        .description("Track your motivation reserves")
        .supportedFamilies([.systemSmall])
    }
}

struct StreakWidget: Widget {
    let kind = "StreakCompactWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            StreakCompactView(data: entry.data)
        }
        .configurationDisplayName("Streak")
        .description("Track your habit streak")
        .supportedFamilies([.systemSmall])
    }
}

struct TodayWidget: Widget {
    let kind = "TodayHabitsWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TodayHabitsView(data: entry.data)
        }
        .configurationDisplayName("Today's Habits")
        .description("See remaining habits")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Color Extension

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        self.init(
            red: Double((rgb & 0xFF0000) >> 16) / 255.0,
            green: Double((rgb & 0x00FF00) >> 8) / 255.0,
            blue: Double(rgb & 0x0000FF) / 255.0
        )
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// REACT NATIVE BRIDGE MODULE
// ═══════════════════════════════════════════════════════════════

export const NATIVE_BRIDGE_CODE = `
// WidgetBridge.swift
import Foundation
import WidgetKit

@objc(WidgetBridge)
class WidgetBridge: NSObject {
    
    @objc
    func saveToAppGroup(_ groupId: String, data: NSDictionary) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8),
              let defaults = UserDefaults(suiteName: groupId)
        else {
            return
        }
        
        defaults.set(jsonString, forKey: "widgetData")
        defaults.synchronize()
        
        // Trigger widget refresh
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
    
    @objc
    func reloadAllTimelines() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

// WidgetBridge.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)

RCT_EXTERN_METHOD(saveToAppGroup:(NSString *)groupId data:(NSDictionary *)data)
RCT_EXTERN_METHOD(reloadAllTimelines)

@end
`;

// ═══════════════════════════════════════════════════════════════
// SETUP INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════

export const WIDGET_SETUP_INSTRUCTIONS = `
# iOS Widget Setup Guide

## 1. Create Widget Extension Target

In Xcode:
1. File → New → Target
2. Select "Widget Extension"
3. Name it "AscentWidgets"
4. Uncheck "Include Live Activity"
5. Finish

## 2. Configure App Groups

For both main app and widget extension:
1. Select target → Signing & Capabilities
2. Add "App Groups" capability
3. Create group: "group.com.ascent.app"

## 3. Add Widget Code

Replace the generated widget code with the Swift code above.

## 4. Add Native Bridge

In main app's ios folder:
1. Create WidgetBridge.swift
2. Create WidgetBridge.m
3. Add to Xcode project

## 5. Update Info.plist

For widget extension, add:
<key>NSUserActivityTypes</key>
<array>
    <string>OpenAppIntent</string>
</array>

## 6. Test Widgets

1. Build and run the app
2. Add widget from home screen
3. Widget should display latest data

## Data Flow

1. App updates → saveWidgetData() called
2. Data saved to App Group UserDefaults
3. Widget reads from shared UserDefaults
4. Timeline provider updates widget

## Widget Families

- systemSmall: Pool or Streak compact
- systemMedium: Today's habits list
- systemLarge: Full dashboard (future)

## Refresh Policy

- Automatic: Every 15 minutes
- Manual: On app foreground
- Triggered: After habit completion
`;

export default {
  prepareWidgetData,
  saveWidgetData,
  refreshWidgets,
  WIDGET_TYPES,
  SWIFT_WIDGET_CODE,
  NATIVE_BRIDGE_CODE,
  WIDGET_SETUP_INSTRUCTIONS,
};
