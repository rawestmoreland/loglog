import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from 'tamagui';

const stoolTypes = [
  {
    type: 1,
    title: 'Separate Hard Lumps',
    image: require('@/assets/bristol/1.webp'),
    description:
      'Hard, separate lumps like nuts, difficult to pass. Indicates severe constipation.',
    color: '#8B4513',
  },
  {
    type: 2,
    title: 'Lumpy and Sausage-like',
    image: require('@/assets/bristol/2.webp'),
    description: 'Lumpy, sausage-shaped but hard. Indicates mild constipation.',
    color: '#A0522D',
  },
  {
    type: 3,
    title: 'Sausage with Cracks',
    image: require('@/assets/bristol/3.webp'),
    description:
      'Sausage-shaped with cracks on surface. Normal, but indicates mild constipation.',
    color: '#CD853F',
  },
  {
    type: 4,
    title: 'Smooth and Soft',
    image: require('@/assets/bristol/4.webp'),
    description: 'Smooth, soft, and sausage-shaped. Ideal, healthy stool type.',
    color: '#D2691E',
  },
  {
    type: 5,
    title: 'Soft Blobs',
    image: require('@/assets/bristol/5.webp'),
    description: 'Soft blobs with clear-cut edges. Indicates lack of fiber.',
    color: '#DEB887',
  },
  {
    type: 6,
    title: 'Mushy Consistency',
    image: require('@/assets/bristol/6.webp'),
    description: 'Fluffy pieces with ragged edges. Indicates mild diarrhea.',
    color: '#D2B48C',
  },
  {
    type: 7,
    title: 'Liquid Consistency',
    image: require('@/assets/bristol/7.webp'),
    description: 'Watery, no solid pieces. Indicates severe diarrhea.',
    color: '#F4A460',
  },
];

export default function BristolScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Bristol Stool Scale</Text>
        <Text style={styles.subtitle}>
          A medical classification tool used to assess digestive health based on
          stool consistency
        </Text>

        {stoolTypes.map((stool) => (
          <Card key={stool.type} style={styles.cardContainer}>
            <View
              style={[styles.typeIndicator, { backgroundColor: stool.color }]}
            >
              <Text style={styles.typeNumber}>Type {stool.type}</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.typeTitleContainer}>
                <Text style={styles.typeTitle}>{stool.title}</Text>
                <Image style={styles.image} source={stool.image} />
              </View>
              <Text style={styles.description}>{stool.description}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 75,
    height: 30,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  cardContainer: {
    padding: 0,
    overflow: 'hidden',
  },
  typeIndicator: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  typeTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
});
