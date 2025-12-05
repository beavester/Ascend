import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAppData } from '../hooks/useAppData';
import { chatWithCoach } from '../services/ai';
import { COACH_SUGGESTIONS } from '../constants/milestones';

const CoachScreen = () => {
  const { colors } = useTheme();
  const { data, addChatMessage, clearChat } = useAppData();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const messages = data.chatMessages || [];

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // Add user message
    addChatMessage('user', messageText);
    setInput('');
    setIsLoading(true);

    try {
      // Get coach response
      const response = await chatWithCoach(
        [...messages, { role: 'user', content: messageText }],
        {
          goal: data.goal,
          streakDays: data.streakDays,
          habits: data.habits,
        }
      );

      addChatMessage('assistant', response);
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage(
        'assistant',
        "I'm having trouble connecting right now. Let's try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    handleSend(suggestion);
  };

  const handleClear = () => {
    clearChat();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.bg2 }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.coachAvatar, { backgroundColor: colors.accent }]}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Coach</Text>
              <Text style={[styles.headerSubtitle, { color: colors.text3 }]}>Here to help you climb</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="sparkles" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Your AI Coach</Text>
              <Text style={[styles.emptyText, { color: colors.text3 }]}>
                I'm here to help you build better habits. Ask me anything about motivation,
                consistency, or overcoming obstacles.
              </Text>

              <View style={styles.suggestions}>
                {COACH_SUGGESTIONS.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionBtn, { backgroundColor: colors.card }]}
                    onPress={() => handleSuggestion(suggestion)}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map((msg, index) => (
                <View
                  key={msg.id || index}
                  style={[
                    styles.message,
                    msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={[styles.messageAvatar, { backgroundColor: colors.accentLight }]}>
                      <Ionicons name="sparkles" size={12} color={colors.accent} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user'
                        ? [styles.userBubble, { backgroundColor: colors.accent }]
                        : [styles.assistantBubble, { backgroundColor: colors.card }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: colors.text },
                        msg.role === 'user' && styles.userMessageText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}

              {isLoading && (
                <View style={[styles.message, styles.assistantMessage]}>
                  <View style={[styles.messageAvatar, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="sparkles" size={12} color={colors.accent} />
                  </View>
                  <View style={[styles.loadingBubble, { backgroundColor: colors.card }]}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.bg2 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg2, color: colors.text }]}
            placeholder="Ask your coach..."
            placeholderTextColor={colors.text3}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.accent }, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  clearBtn: {
    padding: 8,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  suggestions: {
    width: '100%',
  },
  suggestionBtn: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    ...shadows.sm,
  },
  suggestionText: {
    fontSize: 14,
  },
  message: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    ...shadows.sm,
  },
  loadingBubble: {
    padding: 16,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    ...shadows.sm,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    paddingTop: 12,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

export default CoachScreen;
