import { Image, ImageProps, StyleSheet } from 'react-native';

interface LogoImageProps extends Omit<ImageProps, 'source'> {
  size?: number;
  variant?: 'default' | 'icon-only';
}

export function LogoImage({
  size = 80,
  variant = 'default',
  style,
  ...props
}: LogoImageProps) {
  return (
    <Image
      source={require('@/assets/transparent zik.png')}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode="contain"
      {...props}
    />
  );
}
