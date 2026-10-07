import { badgeAtlas } from './artwork'

const artworkMagnification = 1.22
export const canvasPadding = 24
const outerRefractionReach = 3
const outerRefractionProfileWidth = 2

export const vertex = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = vec2(p.x, 1.0 - p.y);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const lensGeometry = `
float lensRadius() {
  return min(uLensSize.x, uLensSize.y) * .5 * (1.0 - .16 * uVertical * uLabels);
}
float lensShape(vec2 p) {
  float radius = lensRadius();
  vec2 q = abs(p) - (uLensSize * .5 - vec2(radius));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}
vec2 screenPoint(vec2 p) { return uVertical > .5 ? p.yx : p; }
`

const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D uBackdrop;
uniform sampler2D uArtwork;
uniform sampler2D uBlurredBackdrop;
uniform vec2 uCanvasSize;
uniform vec2 uSceneSize;
uniform vec2 uBarOrigin;
uniform float uSceneScale;
uniform float uBarWidth;
uniform float uBarHeight;
uniform float uVertical;
uniform float uFirstCenter;
uniform float uLabels;
uniform float uPitch;
uniform float uCount;
uniform vec2 uLensSize;
uniform float uLensX;
uniform float uGrowth;
uniform float uDispersion;
uniform float uRimDistortion;
uniform float uContainerInset;
uniform float uEdgeCurlWidth;
uniform float uEdgeCurlStrength;
uniform float uDark;
uniform sampler2D uAccents;
uniform sampler2D uBadges;
uniform sampler2D uBadgeBounds;
uniform int uBadgeCount;
uniform float uPixel;

float capsule(vec2 p, vec2 size) {
  float radius = min(size.x, size.y) * 0.5;
  vec2 q = abs(p) - max(size * .5 - vec2(radius), vec2(0.0));
  return length(max(q, vec2(0.0))) - radius;
}
float railShape(vec2 p) {
  float original = capsule(p, vec2(uBarWidth, uBarHeight));
  float raised = uVertical * uLabels;
  if (raised <= 0.0) return original;
  float radius = uBarHeight * .5;
  vec2 q = vec2(max(abs(p.x) - (uBarWidth * .5 - radius), 0.0), abs(p.y));
  float norm = pow(pow(q.x, 2.5) + pow(q.y, 2.5), 1.0 / 2.5);
  vec2 gradient = pow(q / max(norm, .001), vec2(1.5));
  return mix(original, (norm - radius) / max(length(gradient), .8), raised);
}
${lensGeometry}
float coverage(float distance) {
  float aa = max(uPixel, fwidth(distance));
  return 1.0 - smoothstep(-aa * .5, aa * .5, distance);
}
float lensShadow(vec2 p) {
  // One lens-owned projection for every receiving surface, including the page
  // beyond the platter. The clear center transmits more light than the bevel.
  vec2 projected = p - vec2(uLensX, uBarHeight * .5) - screenPoint(vec2(0.0, 3.0 * uGrowth));
  float distance = lensShape(projected) + 2.0 * uGrowth;
  float upperWeight = mix(.30, 1.0, clamp(-screenPoint(projected).y / 35.0, 0.0, 1.0));
  float innerShade = .065 * exp(-pow((distance + 7.0) / 4.5, 2.0)) * upperWeight;
  float outerShade = .045 * exp(-.5 * pow(max(distance, 0.0) / 3.0, 2.0)) * smoothstep(-6.0, -1.0, distance);
  return uGrowth * (innerShade + outerShade);
}
vec3 background(vec2 p) {
  vec2 coord = (uBarOrigin + screenPoint(p) * uSceneScale) / uSceneSize;
  return texture(uBackdrop, coord).rgb;
}
vec3 blurBackground(vec2 p) {
  return texture(uBlurredBackdrop, (uBarOrigin + screenPoint(p) * uSceneScale) / uSceneSize).rgb;
}
vec4 badges(vec2 p) {
  vec2 point = screenPoint(p);
  vec2 atlasSize = vec2(float(max(uBadgeCount, 1)) * ${badgeAtlas.cellWidth.toFixed(1)}, ${badgeAtlas.cellHeight.toFixed(1)});
  vec2 dx = dFdx(point) / atlasSize;
  vec2 dy = dFdy(point) / atlasSize;
  vec4 color = vec4(0.0);
  for (int i = 0; i < uBadgeCount; i++) {
    vec4 bounds = texelFetch(uBadgeBounds, ivec2(i, 0), 0);
    vec2 local = point - bounds.xy;
    if (bounds.z > 0.0 && all(greaterThanEqual(local, vec2(-1.0))) && all(lessThanEqual(local, bounds.zw + 1.0))) {
      vec2 atlasPoint = local + vec2(float(i) * ${badgeAtlas.cellWidth.toFixed(1)} + ${badgeAtlas.padding.toFixed(1)}, ${badgeAtlas.padding.toFixed(1)});
      vec4 badge = textureGrad(uBadges, atlasPoint / atlasSize, dx, dy);
      color = badge + color * (1.0 - badge.a);
    }
  }
  return color;
}
vec3 material(vec2 p, vec2 artPoint, vec2 outlinePoint, float selected, float insetWeight) {
  vec3 bg = background(p);
  // Evaluate the rail contour independently of texture warping.
  float lensDepth = -lensShape(outlinePoint - vec2(uLensX, (uBarHeight * .5)));
  // Join the original edge at the rim, then keep a constant inset in the middle.
  float contourJoin = smoothstep(0.0, 8.0, lensDepth);
  float inset = uContainerInset * uGrowth * contourJoin * selected * insetWeight;
  float sd = railShape(outlinePoint - vec2(uBarWidth * .5, uBarHeight * .5)) + inset;
  float inside = mix(coverage(sd), 1.0 - smoothstep(-1.6, 1.6, sd), selected * uGrowth);
  vec3 glass = blurBackground(p);
  float luma = dot(glass, vec3(.2126, .7152, .0722));
  vec3 chroma = glass - vec3(luma);
  float restingSelection = selected * (1.0 - clamp(uGrowth, 0.0, 1.0));
  // Approximate the captured color response: lift tone without washing away
  // chroma, and give the resting selection its own contrast in each appearance.
  float lightTone = mix(.52 + .48 * luma, .39 + .53 * luma, restingSelection);
  float darkTone = .126 + luma * (1.0 - .40 * luma);
  darkTone = mix(darkTone, .87 * darkTone - .07, restingSelection);
  vec3 lightGlass = vec3(lightTone) + chroma * mix(.95, 1.10, restingSelection);
  vec3 darkGlass = vec3(darkTone + .076 * uGrowth) + chroma * mix(1.20, 1.40, restingSelection);
  glass = clamp(mix(lightGlass, darkGlass, uDark), 0.0, 1.0);
  glass += vec3((.5 - clamp(p.y / uBarHeight, 0.0, 1.0)) * .025 * uDark);
  // Keep the contour geometry; adapt its contrast to the sampled backdrop.
  vec2 surfacePoint = outlinePoint - vec2(uBarWidth * .5, (uBarHeight * .5));
  vec2 surfaceGradient = surfacePoint - vec2(clamp(surfacePoint.x, -uBarWidth * .5 + (uBarHeight * .5), uBarWidth * .5 - (uBarHeight * .5)), 0.0);
  vec2 surfaceNormal = surfaceGradient / max(length(surfaceGradient), .001);
  if (uVertical * uLabels > 0.0) {
    vec2 raisedGradient = sign(surfaceGradient) * pow(abs(surfaceGradient), vec2(1.5));
    vec2 raisedNormal = raisedGradient / max(length(raisedGradient), .001);
    surfaceNormal = normalize(mix(surfaceNormal, raisedNormal, uLabels) + vec2(.000001));
  }
  float depth = max(-sd, 0.0);
  float verticalLight = pow(abs(screenPoint(surfaceNormal).y), 4.0);
  float innerLight = exp(-depth / 7.0) * (.035 + .065 * verticalLight) * mix(.30, 1.0, uDark);
  glass = mix(glass, vec3(1.0), innerLight);
  glass *= 1.0 - mix(.010, .055, uDark) * exp(-pow((depth - 9.0) / 7.0, 2.0));
  float border = exp(-abs(sd) * 3.0);
  float wingContrast = 1.0 + .12 * uVertical * selected * uGrowth * insetWeight * pow(abs(surfaceNormal.y), 4.0);
  float brightBackdrop = smoothstep(.20, .90, luma);
  glass *= 1.0 - border * mix(.18, .26, brightBackdrop) * (1.0 - verticalLight) * wingContrast;
  glass = mix(glass, vec3(1.0), border * mix(.38, .12, brightBackdrop) * verticalLight);
  float keyline = exp(-pow((sd + .45) / .45, 2.0));
  glass *= 1.0 - keyline * mix(.07, .12, brightBackdrop) * wingContrast;
  vec3 c = mix(bg, glass, inside);
  c = mix(c, mix(vec3(.20), vec3(.9 * uGrowth), uDark), selected * uGrowth * mix(.008, .012, uDark));
  c *= 1.0 - lensShadow(outlinePoint);
  vec4 artwork = vec4(0.0);
  // The sampled artwork owns its tint, even when a lens covers multiple items.
  float item = clamp(floor((artPoint.x - uFirstCenter) / uPitch + .5), 0.0, uCount - 1.0);
  if (uVertical > .5) {
    // Derive the filter footprint before clipping or jumping between atlas cells.
    vec2 atlasSize = vec2(uCount * 80.0, 192.0);
    float stateOffset = selected * 96.0;
    vec2 atlasDx = dFdx(artPoint.yx) / atlasSize;
    vec2 atlasDy = dFdy(artPoint.yx) / atlasSize;
    vec2 local = vec2(artPoint.y - uBarHeight * .5, artPoint.x - (uFirstCenter + item * uPitch));
    float atlasX = item * 80.0 + 40.0 + local.x;
    float iconY = 24.0 + local.y + 9.5 * uLabels;
    float labelY = 72.0 + local.y - 14.0;
    if (abs(local.x) < 40.0 && iconY >= 0.0 && iconY < 48.0)
      artwork = textureGrad(uArtwork, vec2(atlasX, iconY + stateOffset) / atlasSize, atlasDx, atlasDy);
    if (abs(local.x) < 40.0 && labelY >= 48.0 && labelY < 96.0) {
      vec4 label = textureGrad(uArtwork, vec2(atlasX, labelY + stateOffset) / atlasSize, atlasDx, atlasDy);
      label *= uLabels;
      if (label.a > artwork.a) artwork = label;
    }
  } else if (artPoint.x >= 0.0 && artPoint.x <= uBarWidth && artPoint.y >= 0.0 && artPoint.y <= uBarHeight) {
    artwork = texture(uArtwork, vec2(artPoint.x / uBarWidth, (artPoint.y / uBarHeight + selected) * .5));
  }
  vec3 foreground = clamp(mix((glass - .76) * .25, vec3(.94) + glass * .28, uDark), 0.0, 1.0);
  vec4 accent = texelFetch(uAccents, ivec2(int(item), 0), 0);
  float tintTone = clamp(dot(c, vec3(.2126, .7152, .0722)), 0.0, 1.0);
  vec3 lightTint = accent.rgb - (1.0 - tintTone) * mix(vec3(.18), vec3(.36), accent.rgb);
  vec3 darkTint = accent.rgb - .126 * (1.0 - accent.rgb) + vec3(.59 * tintTone);
  // Retain the tuned held-lens tint while the resting icon blends with its fill.
  vec3 heldTint = mix(accent.rgb * mix(vec3(1.0), c, .08), accent.rgb, uDark) * 1.12;
  vec3 tint = clamp(mix(mix(lightTint, darkTint, uDark), heldTint, clamp(uGrowth, 0.0, 1.0)), 0.0, 1.0);
  float paired = texelFetch(uAccents, ivec2(int(item), 1), 0).r;
  vec3 tinted = mix(c, mix(foreground, tint, selected), artwork.a * mix(1.0, accent.a, selected));
  vec3 colored = c * (1.0 - artwork.a) + artwork.rgb;
  return mix(tinted, colored, paired);
}

void main() {
  vec2 p = screenPoint(uv * uCanvasSize - vec2(${canvasPadding.toFixed(1)}));
  vec2 center = vec2(uLensX, (uBarHeight * .5));
  vec2 d = p - center;
  float barDistance = railShape(p - vec2(uBarWidth * .5, uBarHeight * .5));
  float lensDistance = lensShape(d);
  float barMask = coverage(barDistance);
  float lensMask = coverage(lensDistance);
  float surfaceAlpha = max(barMask, lensMask);
  float shadow = lensShadow(p);
  float alpha = surfaceAlpha + shadow * (1.0 - surfaceAlpha);
  // Transparent neighbors must still evaluate the material: its edge coverage
  // and texture mip levels rely on derivatives across adjacent fragments.

  float radius = lensRadius();
  vec2 straight = max(uLensSize * .5 - vec2(radius), vec2(0.0));
  vec2 radial = d - clamp(d, -straight, straight);
  vec2 normal = radial / max(length(radial), .001);
  float edge = smoothstep(-mix(20.0, 26.0, uVertical), 0.0, lensDistance);
  // A smooth optical normal avoids a shoulder at the straight-to-round join
  // of the capsule. The outline and reflection still use the capsule normal.
  vec2 opticalGradient = d / (uLensSize * uLensSize);
  vec2 opticalNormal = opticalGradient / max(length(opticalGradient), .000001);
  // Keep artwork distortion local to the bevel.
  float bevel = edge * edge * smoothstep(0.0, 8.0, -lensDistance);
  // Sample inward through a wider bevel to stretch artwork outward into the
  // rim. The interior retains uniform magnification instead of being squeezed.
  float artworkBevel = smoothstep(0.0, 2.0, -lensDistance) * (1.0 - smoothstep(3.0, mix(14.0, 18.0, uVertical), -lensDistance));
  artworkBevel *= smoothstep(mix(.35, .55, uVertical), mix(.80, .90, uVertical), abs(d.x) / (uLensSize.x * .5));
  vec2 rimOffset = -opticalNormal * artworkBevel * mix(5.0, 6.0, uVertical) * uRimDistortion * uGrowth;
  // Map each capsule cross-section monotonically onto itself. The center and
  // silhouette stay fixed, while the upper/lower bands compress more strongly
  // than the sides. A bounded coefficient prevents a folded-back bar contour.
  float capX = max(abs(d.x) - (uLensSize.x * .5 - radius), 0.0);
  float capY = max(abs(d.y) - (uLensSize.y * .5 - radius), 0.0);
  float halfY = uLensSize.y * .5 - radius + sqrt(max(radius * radius - capX * capX, .0001));
  float halfX = uLensSize.x * .5 - radius + sqrt(max(radius * radius - capY * capY, .0001));
  vec2 extent = vec2(halfX, halfY);
  vec2 section = clamp(abs(d) / extent, 0.0, 1.0);
  float strength = min(.96, .25 + .70 * uRimDistortion) * uGrowth;
  float sideTransition = 1.0 - smoothstep(.35, .90, abs(d.x) / (uLensSize.x * .5));
  vec2 sectionWarp = sign(d) * extent * (1.0 - section) * vec2(pow(section.x, 4.0) * .45, section.y * section.y * sideTransition) * strength;
  // In a vertical rail the wider optical band stays at the physical top/bottom;
  // simply rotating the horizontal field puts its strongest bend on the sides.
  float acrossTransition = 1.0 - smoothstep(.35, .90, abs(d.y) / (uLensSize.y * .5));
  vec2 verticalWarp = sign(d) * extent * (1.0 - section) * vec2(section.x * section.x * acrossTransition, pow(section.y, 4.0) * .45) * strength;
  sectionWarp = mix(sectionWarp, verticalWarp, uVertical);
  vec2 samplePoint = p + sectionWarp;
  // Uniform scaling about each rail end preserves its underlying contour.
  // Anisotropic lens coordinates would flatten or pinch it.
  float endDistance = min(p.x, uBarWidth - p.x);
  float endWeight = (1.0 - smoothstep(uBarHeight * .5 - 2.0 * (1.0 - uVertical), uBarHeight * .5 + 18.0, endDistance)) * smoothstep(0.0, 7.0, -lensDistance);
  vec2 endCenter = vec2(p.x < uBarWidth * .5 ? (uBarHeight * .5) : uBarWidth - (uBarHeight * .5), (uBarHeight * .5));
  float endCompression = uContainerInset / (uBarHeight * .5 - uContainerInset);
  vec2 circularSample = endCenter + (p - endCenter) * (1.0 + endCompression * uGrowth);
  samplePoint = mix(samplePoint, circularSample, endWeight);
  // The platter compresses, but the separate artwork copy magnifies uniformly.
  float item = clamp(floor((p.x - uFirstCenter) / uPitch + .5), 0.0, uCount - 1.0);
  vec2 itemCenter = vec2(uFirstCenter + item * uPitch, (uBarHeight * .5));
  vec2 artPoint = itemCenter + (p - itemCenter) / (1.0 + uGrowth * mix(${(artworkMagnification - 1).toFixed(4)}, .16 + .06 * uLabels, uVertical)) + rimOffset;
  float spread = uDispersion * uGrowth * (.1 + bevel * mix(3.0, 4.5, uVertical));
  float artworkSpread = uDispersion * uGrowth * (.04 + artworkBevel * mix(2.4, 3.4, uVertical));
  vec2 outlineNormal = opticalNormal;
  float outlineSpread = spread;
  if (uVertical > .5) {
    vec2 capGradient = sign(p - endCenter) * pow(abs(p - endCenter), vec2(1.5));
    vec2 capNormal = capGradient / max(length(capGradient), .001);
    outlineNormal = mix(vec2(0.0, d.y < 0.0 ? -1.0 : 1.0), capNormal, endWeight);
    float middle = (1.0 - smoothstep(uLensSize.x * .225, uLensSize.x * .39, abs(d.x))) * (1.0 - endWeight);
    outlineSpread = mix(spread, uDispersion * uGrowth * .45, middle);
    outlineSpread *= smoothstep(0.0, 7.0, -lensDistance);
  }
  // The droplet transition and its faint companion curve belong to the vertical rail.
  // The displacement vanishes at the silhouette and inside the narrow bevel.
  float curlDepth = clamp(-lensDistance / uEdgeCurlWidth, 0.0, 1.0);
  float curlBand = 16.0 * curlDepth * curlDepth * (1.0 - curlDepth) * (1.0 - curlDepth);
  float curlEnds = smoothstep(.25, .55, abs(d.x) / (uLensSize.x * .5));
  float curlSides = uVertical * smoothstep(.35, .75, abs(normal.y));
  vec2 curlOffset = vec2(0.0, -sign(d.y)) * curlBand * curlEnds * curlSides * uEdgeCurlStrength * uGrowth;
  vec2 curlRed = curlOffset * (1.0 + .18 * uDispersion);
  vec2 curlBlue = curlOffset * (1.0 - .18 * uDispersion);
  vec3 curled;
  curled.r = material(samplePoint + opticalNormal * spread + curlRed, artPoint + opticalNormal * artworkSpread + curlRed, p + outlineNormal * outlineSpread + curlRed, 1.0, 1.0).r;
  curled.g = material(samplePoint + curlOffset, artPoint + curlOffset, p + curlOffset, 1.0, 1.0).g;
  curled.b = material(samplePoint - opticalNormal * spread + curlBlue, artPoint - opticalNormal * artworkSpread + curlBlue, p - outlineNormal * outlineSpread + curlBlue, 1.0, 1.0).b;
  vec3 refracted = curled;
  // Uniform conditions keep texture derivatives valid and skip the unused image
  // in horizontal mode, at rest, or with the curl disabled.
  if (uVertical > .5 && uGrowth != 0.0 && uEdgeCurlStrength > 0.0) {
    vec3 natural;
    natural.r = material(samplePoint + opticalNormal * spread, artPoint + opticalNormal * artworkSpread, samplePoint + outlineNormal * outlineSpread, 1.0, 0.0).r;
    natural.g = material(samplePoint, artPoint, samplePoint, 1.0, 0.0).g;
    natural.b = material(samplePoint - opticalNormal * spread, artPoint - opticalNormal * artworkSpread, samplePoint - outlineNormal * outlineSpread, 1.0, 0.0).b;
    // Keep the faint optical contour beside the inset curl, except at the rail ends.
    float naturalWeight = .30 * uGrowth * smoothstep(0.0, .5, uEdgeCurlStrength) * curlSides * (1.0 - endWeight);
    refracted = mix(curled, natural, naturalWeight);
  }

  // Almost clear when held: no opaque fill or continuous white rim.
  float rim = exp(-abs(lensDistance + .2) * 2.0) * mix(.3 * uDark, 1.0, uGrowth);
  float light = pow(max(0.0, dot(screenPoint(normal), normalize(vec2(-.65, -1.0)))), 5.0);
  float separation = uDispersion * uGrowth * .75;
  vec3 reflection = exp(-abs(vec3(lensDistance + .2) + vec3(separation, 0.0, -separation)) * 2.0);
  reflection *= mix(.3 * uDark, 1.0, uGrowth) * (light * .24 + uDark * .14);
  refracted = mix(refracted, vec3(1.0), reflection);
  refracted *= 1.0 - rim * (.20 - light * .08);
  vec3 surface = mix(material(p, p, p, 0.0, 0.0), refracted, lensMask);
  // Badges retain their own size and palette while the bevel bends their pixels.
  // Composite them independently so their overflow is not clipped to the rail.
  vec2 badgePoint = p + rimOffset;
  vec4 badgeRed = badges(badgePoint + opticalNormal * artworkSpread + curlRed);
  vec4 badgeGreen = badges(badgePoint + curlOffset);
  vec4 badgeBlue = badges(badgePoint - opticalNormal * artworkSpread + curlBlue);
  vec4 refractedBadge = vec4(badgeRed.r, badgeGreen.g, badgeBlue.b, max(badgeRed.a, max(badgeGreen.a, badgeBlue.a)));
  vec4 restingBadge = badges(p);
  vec4 badge = mix(restingBadge, refractedBadge, lensMask);
  // Each dispersed channel obscures the material only where its own sample covers it.
  vec3 badgeCoverage = mix(vec3(restingBadge.a), vec3(badgeRed.a, badgeGreen.a, badgeBlue.a), lensMask);
  vec3 color = badge.rgb + surface * surfaceAlpha * (1.0 - badgeCoverage);
  alpha = badge.a + alpha * (1.0 - badge.a);
  outColor = vec4(color / max(alpha, .001), alpha);
}`

const outerFragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D uSurface;
uniform vec2 uCanvasSize;
uniform vec2 uLensSize;
uniform float uLensX;
uniform float uBarHeight;
uniform float uVertical;
uniform float uLabels;
uniform float uGrowth;
uniform float uDispersion;
uniform float uStrength;
${lensGeometry}
vec4 surface(vec2 point) {
  // Framebuffer textures have the opposite Y direction to the canvas coordinates.
  return texture(uSurface, vec2(point.x, 1.0 - point.y));
}
void main() {
  vec4 original = surface(uv);
  vec2 p = screenPoint(uv * uCanvasSize - vec2(${canvasPadding.toFixed(1)}));
  vec2 d = p - vec2(uLensX, uBarHeight * .5);
  float depth = -lensShape(d);
  if (depth <= 0.0 || depth >= ${outerRefractionReach.toFixed(1)}) {
    outColor = original;
    return;
  }
  float t = depth / ${outerRefractionProfileWidth.toFixed(1)};
  float band = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  vec2 straight = max(uLensSize * .5 - vec2(lensRadius()), vec2(0.0));
  vec2 radial = d - clamp(d, -straight, straight);
  vec2 normal = radial / max(length(radial), .001);
  vec2 offset = screenPoint(normal) * band * uStrength * uGrowth / uCanvasSize;
  float dispersion = .15 * uDispersion;
  vec3 refracted = vec3(
    surface(uv - offset * (1.0 + dispersion)).r,
    surface(uv - offset).g,
    surface(uv - offset * (1.0 - dispersion)).b
  );
  // Keep the incoming contour visible beside its displaced image.
  outColor = vec4(mix(original.rgb, refracted, .60), original.a);
}`

// Specialize the common optical model once, rather than branching on orientation per frame.
export function glassShaders(vertical: boolean) {
  const specialize = (source: string) =>
    source.replaceAll(
      'uniform float uVertical;',
      `const float uVertical = ${vertical ? '1.0' : '0.0'};`,
    )
  return { fragment: specialize(fragment), outerFragment: specialize(outerFragment) }
}
