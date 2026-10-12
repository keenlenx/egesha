import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type Props = {
  disabled: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onSwipe: () => void;
};

const THUMB_SIZE = 56;

export default function SwipeAction({ disabled, icon, label, color, onSwipe }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const maxTranslateX = Math.max(0, trackWidth - THUMB_SIZE - 4);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.get() + THUMB_SIZE,
  }));

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      translateX.set(Math.min(Math.max(event.translationX, 0), maxTranslateX));
    })
    .onEnd((event) => {
      if (event.translationX >= maxTranslateX * 0.75 && maxTranslateX > 0) {
        translateX.set(withSpring(0));
        runOnJS(onSwipe)();
      } else {
        translateX.set(withSpring(0));
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[styles.track, disabled && styles.disabled]}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Ionicons name={icon} size={26} color={color} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  disabled: { opacity: 0.55 },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 30,
    opacity: 0.16,
  },
  label: {
    alignSelf: 'center',
    maxWidth: '72%',
    fontSize: 15,
    fontWeight: '700',
  },
  thumb: {
    position: 'absolute',
    left: 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: 'white',
  },
});