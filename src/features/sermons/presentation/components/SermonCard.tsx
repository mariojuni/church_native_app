import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Heart, Clock, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing } from '@/constants/theme';
import type { Sermon } from '../../domain/sermon.types';

interface SermonCardProps {
  sermon: Sermon;
  onPress: () => void;
  onFavorite: () => void;
  isFavorited: boolean;
}

export function SermonCard({ sermon, onPress, onFavorite, isFavorited }: SermonCardProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins} min`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.backgroundElement }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <Image 
        source={{ uri: sermon.thumbnailUrl }} 
        style={styles.thumbnail}
        resizeMode="cover"
      />
      
      {/* Badge for type */}
      <View style={[styles.badge, sermon.type === 'video' ? styles.videoBadge : styles.audioBadge]}>
        <Text style={styles.badgeText}>{sermon.type.toUpperCase()}</Text>
      </View>

      {/* Favorite button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={onFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Heart
          size={22}
          color={isFavorited ? '#FF6596' : '#FFF'}
          fill={isFavorited ? '#FF6596' : 'transparent'}
          strokeWidth={2}
        />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {sermon.title}
        </Text>
        
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <User size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {sermon.speaker.name}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDuration(sermon.duration)}
            </Text>
          </View>
        </View>

        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(sermon.date)}
        </Text>

        {sermon.series && (
          <View style={styles.seriesTag}>
            <Text style={styles.seriesText} numberOfLines={1}>{sermon.series.title}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  audioBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.two,
    lineHeight: 24,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    flex: 1,
  },
  date: {
    fontSize: 13,
    marginTop: Spacing.one,
  },
  seriesTag: {
    marginTop: Spacing.two,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(100, 100, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  seriesText: {
    color: '#6464FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
