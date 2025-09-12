/**
 * About & Help Screen
 * Purpose: Explain rules, boosters usage, contact/support links
 * How to extend: Add FAQ section, video tutorials, community links
 */

import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help? Reach out to us!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@wordlemini.com') }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. This app stores game data locally on your device and does not collect personal information.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About & Help</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.appTitle}>Wordle Mini 🎯</Text>
          <Text style={styles.appSubtitle}>
            Guess 5-letter English words level by level, earn coins and use boosters!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Play</Text>
          <Text style={styles.sectionText}>
            Guess the hidden 5-letter word in 6 attempts or fewer. Each guess must be a valid English word.
          </Text>
          
          <View style={styles.rulesContainer}>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#6aaa64' }]} />
              <Text style={styles.ruleText}>
                <Text style={styles.bold}>Green:</Text> Letter is in the word and in the correct position
              </Text>
            </View>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#c9b458' }]} />
              <Text style={styles.ruleText}>
                <Text style={styles.bold}>Yellow:</Text> Letter is in the word but in the wrong position
              </Text>
            </View>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#787c7e' }]} />
              <Text style={styles.ruleText}>
                <Text style={styles.bold}>Gray:</Text> Letter is not in the word
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boosters</Text>
          <Text style={styles.sectionText}>
            Use coins to purchase helpful boosters during gameplay:
          </Text>

          <View style={styles.boosterList}>
            <View style={styles.boosterItem}>
              <Ionicons name="location" size={20} color="#ff6b35" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Dart (15 coins)</Text>
                <Text style={styles.boosterDesc}>Remove up to 3 incorrect letters from the keyboard</Text>
              </View>
            </View>
            <View style={styles.boosterItem}>
              <Ionicons name="bulb" size={20} color="#ffd60a" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Hint (25 coins)</Text>
                <Text style={styles.boosterDesc}>Reveal and lock 1 correct letter position</Text>
              </View>
            </View>
            <View style={styles.boosterItem}>
              <Ionicons name="play-forward" size={20} color="#06d6a0" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Skip (50 coins)</Text>
                <Text style={styles.boosterDesc}>Advance to the next level without completing current one</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring & Coins</Text>
          <Text style={styles.sectionText}>
            • Earn coins by completing levels{'\n'}
            • Higher scores for fewer attempts{'\n'}
            • Bonus coins for perfect games{'\n'}
            • Use coins to purchase boosters
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips & Strategy</Text>
          <Text style={styles.sectionText}>
            • Start with common vowels (A, E, I, O, U){'\n'}
            • Use common consonants (R, S, T, L, N){'\n'}
            • Pay attention to letter frequency{'\n'}
            • Eliminate letters systematically{'\n'}
            • Don't waste guesses on impossible words
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.linkButton} onPress={handleContactSupport}>
            <Ionicons name="mail" size={20} color="#666" />
            <Text style={styles.linkText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark" size={20} color="#666" />
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for word game lovers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  rulesContainer: {
    marginTop: 16,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileExample: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  boosterList: {
    marginTop: 16,
  },
  boosterItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boosterInfo: {
    marginLeft: 12,
    flex: 1,
  },
  boosterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  boosterDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  linkText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});