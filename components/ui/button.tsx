import { PropsWithChildren } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PropsWithChildren {
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: theme.primary },
          text: { color: theme.primaryForeground },
          loader: theme.primaryForeground,
        };
      case 'secondary':
        return {
          container: { backgroundColor: theme.secondary },
          text: { color: theme.secondaryForeground },
          loader: theme.secondaryForeground,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.border
          },
          text: { color: theme.foreground },
          loader: theme.foreground,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: theme.foreground },
          loader: theme.foreground,
        };
      case 'destructive':
        return {
          container: { backgroundColor: theme.destructive },
          text: { color: theme.destructiveForeground },
          loader: theme.destructiveForeground,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles.container,
        styles[`${size}Container`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={variantStyles.loader} />
        </View>
      ) : (
        <Text
          style={[
            styles.text,
            variantStyles.text,
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Size: Container
  smContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mdContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lgContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  // Text base
  text: {
    fontWeight: '600',
  },

  // Size: Text
  smText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mdText: {
    fontSize: 16,
    lineHeight: 24,
  },
  lgText: {
    fontSize: 18,
    lineHeight: 28,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
