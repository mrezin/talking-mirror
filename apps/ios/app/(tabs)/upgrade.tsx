import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$2.99',
    period: '/ week',
    description: 'Try premium for a week',
    highlighted: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$7.99',
    period: '/ month',
    description: 'Most popular choice',
    highlighted: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$49.99',
    period: '/ year',
    description: 'Best value — save 48%',
    highlighted: false,
  },
];

const PREMIUM_FEATURES = [
  '✨ Personalized AI compliments',
  '🎨 Advanced lucky color & wardrobe tips',
  '📚 Unlimited compliment history',
  '🔔 Custom notification time',
  '🚀 New seasonal packs first',
  '🚫 Ad-free experience',
];

export default function UpgradeScreen() {
  const [selectedPlan, setSelectedPlan] = React.useState('monthly');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Go Premium ✨</Text>
        <Text style={styles.subtitle}>
          Unlock the full TalkingMirror experience
        </Text>

        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <Text key={index} style={styles.featureText}>{feature}</Text>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Choose your plan</Text>
        {PLANS.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.highlighted && styles.planCardHighlighted,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.highlighted && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {plan.price}<Text style={styles.planPeriod}>{plan.period}</Text>
            </Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.trialText}>7-day free trial • Cancel anytime</Text>

        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>Start Free Trial</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscription auto-renews. Cancel at any time in App Store settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#bbb', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  featuresContainer: { backgroundColor: '#2d2d4e', borderRadius: 12, padding: 16, marginBottom: 24 },
  featureText: { color: '#fff', fontSize: 15, marginBottom: 8 },
  sectionLabel: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  planCard: { backgroundColor: '#2d2d4e', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  planCardSelected: { borderColor: '#9b59b6' },
  planCardHighlighted: { backgroundColor: '#3d2d5e' },
  popularBadge: { backgroundColor: '#9b59b6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 8 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  planPrice: { color: '#9b59b6', fontSize: 22, fontWeight: '800', marginTop: 4 },
  planPeriod: { color: '#aaa', fontSize: 14, fontWeight: '400' },
  planDescription: { color: '#aaa', fontSize: 13, marginTop: 4 },
  trialText: { color: '#9b59b6', textAlign: 'center', fontSize: 14, marginTop: 8, marginBottom: 16 },
  ctaButton: { backgroundColor: '#9b59b6', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  legalText: { color: '#666', fontSize: 11, textAlign: 'center' },
});
