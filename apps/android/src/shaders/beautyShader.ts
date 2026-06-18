/**
 * Skia SkSL beauty filter shader.
 *
 * Uniforms:
 *   - image: source camera frame (bound automatically by Skia)
 *   - blurRadius: controls Gaussian blur sigma (0 – 1)
 *   - brightness: RGB multiplier (1.0 – 1.4)
 *
 * Algorithm:
 *   1. Gaussian blur (variable-radius loop)
 *   2. Mix original + blurred at 60 % original weight
 *   3. Multiply .rgb by brightness
 *   4. Warm skin-tone boost: .r *= 1.05
 *   5. Clamp to [0, 1]
 */
export const BEAUTY_SHADER_SRC = `
uniform shader image;
uniform float blurRadius;
uniform float brightness;

half4 main(float2 coord) {
  half4 original = image.eval(coord);

  float sigma = blurRadius * 4.0 + 0.5;
  int r = int(sigma * 2.0);
  if (r < 1) {
    r = 1;
  }

  half4 sum = half4(0.0);
  float weightSum = 0.0;

  int dy = -r;
  while (dy <= r) {
    int dx = -r;
    while (dx <= r) {
      float2 offset = float2(float(dx), float(dy));
      float w = exp(-dot(offset, offset) / (2.0 * sigma * sigma));
      sum += image.eval(coord + offset) * half4(w);
      weightSum += w;
      dx++;
    }
    dy++;
  }

  half4 blurred = sum / half4(weightSum);

  // Mix: 60 % original + 40 % blurred (subtle smoothing)
  half4 mixed = original * 0.6 + blurred * 0.4;

  // Brightness
  mixed.rgb *= half3(brightness);

  // Warm skin-tone boost
  mixed.r *= 1.05;

  // Clamp
  mixed = clamp(mixed, half4(0.0), half4(1.0));

  return mixed;
}
`;

import { Skia } from '@shopify/react-native-skia';

/**
 * Compiles the beauty shader.
 * Safe to call outside worklets — throws on compile error.
 */
export function createBeautyEffect() {
  const effect = Skia.RuntimeEffect.Make(BEAUTY_SHADER_SRC);
  if (!effect) {
    throw new Error('[beautyShader] Failed to compile SkSL beauty shader');
  }
  return effect;
}
