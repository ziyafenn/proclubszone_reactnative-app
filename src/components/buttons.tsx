import React from 'react';
import {Pressable, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {APP_COLORS, FONT_SIZES, TEXT_STYLES} from '../utils/designSystem';
import {verticalScale, ScaledSheet} from 'react-native-size-matters';

type ButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean;
};

//---------- Primary Button ----------//

export const PrimaryButton = ({onPress, title, disabled}: ButtonProps) => (
  <Pressable onPress={onPress} disabled={disabled}>
    <View
      style={[
        styles.buttonBg,
        {
          backgroundColor: disabled ? APP_COLORS.Gray : APP_COLORS.Accent,
        },
      ]}>
      <Text
        style={[
          TEXT_STYLES.buttonLabel,
          {
            color: disabled ? 'rgba(0, 0, 0, 0.4)' : APP_COLORS.Dark,
          },
        ]}>
        {title.toUpperCase()}
      </Text>
    </View>
  </Pressable>
);

//---------- Big Button ----------//

export const BigButton = ({title, onPress, disabled}: ButtonProps) => (
  <Pressable onPress={onPress} disabled={disabled}>
    <View
      style={[
        styles.bigButton,
        {
          backgroundColor: disabled ? APP_COLORS.Gray : APP_COLORS.Accent,
        },
      ]}>
      <Text
        style={[
          TEXT_STYLES.buttonLabel,
          {
            color: disabled ? 'rgba(0, 0, 0, 0.4)' : APP_COLORS.Dark,
          },
        ]}>
        {title.toUpperCase()}
      </Text>
    </View>
  </Pressable>
);

//---------- Big Alt Button ----------//

export const BigButtonOutlined = ({
  title,
  onPress,
  disabled = false,
}: ButtonProps) => (
  <Pressable disabled={disabled} onPress={onPress}>
    <View
      style={[
        styles.bigButtonOutlined,
        {
          borderColor: disabled ? APP_COLORS.Gray : APP_COLORS.Accent,
        },
      ]}>
      <Text
        style={{
          ...TEXT_STYLES.buttonLabel,
          color: disabled ? APP_COLORS.Gray : APP_COLORS.Accent,
        }}>
        {title.toUpperCase()}
      </Text>
    </View>
  </Pressable>
);

//---------- Icon Button ----------//

export const IconButton = ({
  onPress,
  name,
  color,
}: {
  onPress: () => void;
  name: string;
  color?: APP_COLORS;
}) => (
  <Pressable onPress={onPress}>
    <View style={styles.iconContainer}>
      <Icon
        name={name}
        size={FONT_SIZES.M}
        color={color ? color : APP_COLORS.Dark}
      />
    </View>
  </Pressable>
);

//---------- Minimal Button ----------//

const MinButton = ({
  onPress,
  title,
  secondary,
  disabled,
}: ButtonProps & {secondary?: boolean}) => (
  <Pressable onPress={onPress} disabled={!!disabled}>
    <View
      style={[
        styles.buttonBg,
        styles.noShadow,
        {
          backgroundColor: 'transparent',
          paddingHorizontal: verticalScale(8),
        },
      ]}>
      <Text
        style={[
          TEXT_STYLES.buttonLabel,
          {
            color: disabled
              ? APP_COLORS.Gray
              : secondary
              ? APP_COLORS.Light
              : APP_COLORS.Accent,
          },
        ]}>
        {title.toUpperCase()}
      </Text>
    </View>
  </Pressable>
);

export {MinButton};

//---------- Stylesheet ----------//

const styles = ScaledSheet.create({
  buttonBg: {
    backgroundColor: APP_COLORS.Accent,
    paddingHorizontal: '16@vs',
    borderRadius: '2@vs',
    height: '36@vs',
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowRadius: 1,
    shadowOpacity: 0.2,
  },
  noShadow: {
    elevation: 0,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  iconContainer: {
    width: '48@vs',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  bigButtonOutlined: {
    height: '48@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '2@vs',
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  bigButton: {
    height: '56@vs',
    elevation: 4,
    justifyContent: 'center',
    borderRadius: 0,
  },
});
