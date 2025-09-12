import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Onboarding Screen
 * Purpose: Introduce new users to Wordle Mini gameplay and rules
 * Features: Multi-slide tutorial, game rules explanation, visual examples
 * How to extend: Add more slides, interactive examples, or video tutorials
 */

const slides = [
  {
    title: "Welcome to Wordle Mini!",
    description: "Guess 5-letter English words level by level. Earn coins and use boosters to help you succeed!",
    icon: "game-controller-outline"
  },
  {
    title: "How to Play",
    description: "You have 6 attempts to guess the correct 5-letter word. Each guess must be a valid English word.",
    icon: "bulb-outline"
  },
  {
    title: "Color Clues",
    description: "🟩 Green: Correct letter in correct position\n🟨 Yellow: Correct letter in wrong position\n⬜ Gray: Letter not in the word",
    icon: "color-palette-outline"
  },
  {
    title: "Boosters & Coins",
    description: "Earn coins by completing levels. Use boosters like Dart, Hint, and Skip to help you win!",
    icon: "star-outline"
  }
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace('/');
    }
  };

  const skipOnboarding = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.slideContainer}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={slides[currentSlide].icon} 
              size={80} 
              color="#6366f1" 
            />
          </View>
          
          <Text style={styles.title}>{slides[currentSlide].title}</Text>
          <Text style={styles.description}>{slides[currentSlide].description}</Text>
          
          {currentSlide === 2 && (
            <View style={styles.exampleContainer}>
              <View style={styles.exampleRow}>
                <View style={[styles.exampleTile, styles.greenTile]}>
                  <Text style={styles.tileText}>W</Text>
                </View>
                <View style={[styles.exampleTile, styles.yellowTile]}>
                  <Text style={styles.tileText}>O</Text>
                </View>
                <View style={[styles.exampleTile, styles.grayTile]}>
                  <Text style={styles.tileText}>R</Text>
                </View>
                <View style={[styles.exampleTile, styles.grayTile]}>
                  <Text style={styles.tileText}>D</Text>
                </View>
                <View style={[styles.exampleTile, styles.grayTile]}>
                  <Text style={styles.tileText}>S</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity onPress={nextSlide} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slideContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  exampleContainer: {
    marginTop: 30,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exampleTile: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  greenTile: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  yellowTile: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04',
  },
  grayTile: {
    backgroundColor: '#6b7280',
    borderColor: '#4b5563',
  },
  tileText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#6366f1',
  },
  inactiveDot: {
    backgroundColor: '#d1d5db',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});