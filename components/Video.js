/**
 * components/Video.js
 *
 * Video con las mismas props que tenía el de expo-av (que Expo 58 ya no trae), hecho sobre
 * expo-video. Las pantallas lo usan igual que antes:
 *   source={{ uri }}, style, resizeMode ('contain' | 'cover' | 'stretch'), useNativeControls,
 *   shouldPlay, isLooping, isMuted, progressUpdateIntervalMillis,
 *   onPlaybackStatusUpdate(status), onReadyForDisplay({ naturalSize }), onError(mensaje).
 * Por ref: playAsync(), pauseAsync() y setPositionAsync(ms).
 *
 * El estado que recibe onPlaybackStatusUpdate tiene los campos de antes que usa la app:
 * isLoaded, isPlaying, isBuffering, positionMillis, durationMillis y didJustFinish.
 *
 * `style` va a un View que envuelve al video, y el video lo llena al 100 %: con la arquitectura
 * nueva, la vista de expo-video queda en 0 de alto si su tamaño sale solo de top/bottom
 * (absoluteFill), como en Reels.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const CONTENT_FIT = { contain: 'contain', cover: 'cover', stretch: 'fill' };

const styles = StyleSheet.create({
  // overflow: las esquinas redondeadas del estilo también recortan el video.
  frame: { overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
});

/**
 * Tamaño con el que se ve el video. En el celular sale de un cuadro del video, porque el de la
 * pista viene sin rotar (los videos verticales de celular suelen guardarse acostados); en la web,
 * del <video>.
 */
async function displaySizeOf(player) {
  if (Platform.OS === 'web') {
    const element = [...(player._mountedVideos || [])][0];
    return element?.videoWidth ? { width: element.videoWidth, height: element.videoHeight } : null;
  }
  try {
    const [frame] = await player.generateThumbnailsAsync(0, { maxWidth: 160, maxHeight: 160 });
    if (frame?.width && frame?.height) return { width: frame.width, height: frame.height };
  } catch {
    // Sin cuadro (p. ej. un formato raro): queda el tamaño de la pista.
  }
  const size = player.videoTrack?.size;
  return size?.width && size?.height ? { width: size.width, height: size.height } : null;
}

const Video = forwardRef(function Video({
  source,
  style,
  resizeMode = 'contain',
  useNativeControls = false,
  shouldPlay = false,
  isLooping = false,
  isMuted = false,
  progressUpdateIntervalMillis = 500,
  onPlaybackStatusUpdate,
  onReadyForDisplay,
  onError,
  ...viewProps
}, ref) {
  const uri = source?.uri || null;
  // Las pantallas pasan funciones nuevas en cada render: se leen siempre las últimas.
  const callbacks = useRef({});
  callbacks.current = { onPlaybackStatusUpdate, onReadyForDisplay, onError };
  const loaded = useRef(false);
  const sizeSent = useRef(false);

  const player = useVideoPlayer(uri ? { uri } : null, (newPlayer) => {
    newPlayer.loop = isLooping;
    newPlayer.muted = isMuted;
    newPlayer.timeUpdateEventInterval = progressUpdateIntervalMillis / 1000;
  });

  useEffect(() => {
    loaded.current = false;
    sizeSent.current = false;
  }, [player, uri]);

  useEffect(() => { player.loop = isLooping; }, [player, isLooping]);
  useEffect(() => { player.muted = isMuted; }, [player, isMuted]);
  useEffect(() => { player.timeUpdateEventInterval = progressUpdateIntervalMillis / 1000; }, [player, progressUpdateIntervalMillis]);
  useEffect(() => {
    if (shouldPlay) player.play();
    else player.pause();
  }, [player, shouldPlay, uri]);

  useEffect(() => {
    const report = (extra) => {
      const notify = callbacks.current.onPlaybackStatusUpdate;
      if (!notify) return;
      const duration = player.duration;
      notify({
        isLoaded: loaded.current && player.status !== 'error',
        isPlaying: player.playing,
        isBuffering: player.status === 'loading',
        isLooping: player.loop,
        isMuted: player.muted,
        positionMillis: Math.round((player.currentTime || 0) * 1000),
        durationMillis: duration > 0 ? Math.round(duration * 1000) : undefined,
        didJustFinish: false,
        ...extra,
      });
    };

    const subscriptions = [
      player.addListener('statusChange', ({ status, error }) => {
        if (status === 'error') {
          callbacks.current.onError?.(error?.message || 'No se pudo reproducir el video');
        }
        if (status === 'readyToPlay') {
          loaded.current = true;
          if (!sizeSent.current && callbacks.current.onReadyForDisplay) {
            sizeSent.current = true;
            displaySizeOf(player).then((naturalSize) => {
              if (naturalSize) callbacks.current.onReadyForDisplay?.({ naturalSize });
            });
          }
        }
        report();
      }),
      player.addListener('playingChange', () => report()),
      player.addListener('timeUpdate', () => report()),
      player.addListener('sourceLoad', () => report()),
      player.addListener('playToEnd', () => report({ didJustFinish: true })),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [player]);

  useImperativeHandle(ref, () => ({
    playAsync: async () => { player.play(); },
    pauseAsync: async () => { player.pause(); },
    setPositionAsync: async (millis) => { player.currentTime = (millis || 0) / 1000; },
  }), [player]);

  return (
    <View {...viewProps} style={[styles.frame, style]}>
      <VideoView
        // En Android, TextureView respeta las esquinas redondeadas y lo que se pone encima
        // (controles, listas); SurfaceView, el de fábrica, no.
        surfaceType="textureView"
        player={player}
        style={styles.fill}
        contentFit={CONTENT_FIT[resizeMode] || 'contain'}
        nativeControls={useNativeControls}
      />
    </View>
  );
});

export default Video;
