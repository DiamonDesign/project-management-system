import { useEffect, useRef, useState } from 'react';
import type { PerformanceExtended } from '@/types';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  listSize: number;
  isVirtualized: boolean;
  frameRate: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  trackMemory?: boolean;
  trackFrameRate?: boolean;
  reportThreshold?: number; // Only report if render time > threshold (ms)
}

export const usePerformanceMonitor = (
  listSize: number,
  isVirtualized: boolean,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    trackMemory = false,
    trackFrameRate = false,
    reportThreshold = 16 // 60fps threshold
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const renderStartTime = useRef<number>(0);
  const frameRateRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  // Start performance measurement
  const startMeasurement = () => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  };

  // End performance measurement
  const endMeasurement = () => {
    if (!enabled || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > reportThreshold) {
      const newMetrics: PerformanceMetrics = {
        renderTime,
        listSize,
        isVirtualized,
        frameRate: frameRateRef.current
      };

      if (trackMemory && 'memory' in performance) {
        newMetrics.memoryUsage = (performance as PerformanceExtended).memory!.usedJSHeapSize / 1024 / 1024; // MB
      }

      setMetrics(newMetrics);
    }

    renderStartTime.current = 0;
  };

  // Track frame rate
  useEffect(() => {
    if (!enabled || !trackFrameRate) return;

    let animationId: number;
    const updateFrameRate = (timestamp: number) => {
      if (lastFrameTime.current !== 0) {
        const delta = timestamp - lastFrameTime.current;
        frameRateRef.current = Math.round(1000 / delta);
      }
      lastFrameTime.current = timestamp;
      animationId = requestAnimationFrame(updateFrameRate);
    };

    animationId = requestAnimationFrame(updateFrameRate);
    return () => cancelAnimationFrame(animationId);
  }, [enabled, trackFrameRate]);

  // Performance warnings
  useEffect(() => {
    if (!metrics || !enabled) return;

    const { renderTime, listSize, isVirtualized, frameRate } = metrics;

    // Warn about slow renders
    if (renderTime > 100) {
      console.warn(`🐌 Slow list render detected:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        listSize,
        isVirtualized,
        recommendation: !isVirtualized && listSize > 50 
          ? 'Consider enabling virtual scrolling' 
          : 'Check for expensive re-renders'
      });
    }

    // Warn about low frame rate
    if (trackFrameRate && frameRate < 30) {
      console.warn(`📉 Low frame rate detected: ${frameRate}fps`);
    }

    // Suggest virtualization for large lists
    if (!isVirtualized && listSize > 100) {
      console.info(`💡 Performance tip: Consider virtual scrolling for ${listSize} items`);
    }
  }, [metrics, enabled, trackFrameRate]);

  return {
    startMeasurement,
    endMeasurement,
    metrics,
    isEnabled: enabled
  };
};

// Hook for monitoring scroll performance
export const useScrollPerformance = (enabled = process.env.NODE_ENV === 'development') => {
  const [scrollMetrics, setScrollMetrics] = useState({
    fps: 60,
    jank: false,
    averageFrameTime: 16.67
  });

  useEffect(() => {
    if (!enabled) return;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let frameTimes: number[] = [];
    let animationId: number;

    const measureScrollPerformance = (currentTime: number) => {
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      frameCount++;

      // Calculate metrics every 60 frames
      if (frameCount >= 60) {
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = Math.round(1000 / averageFrameTime);
        const jank = frameTimes.some(time => time > 50); // Frame time > 50ms indicates jank

        setScrollMetrics({
          fps,
          jank,
          averageFrameTime
        });

        frameCount = 0;
        frameTimes = [];
      }

      lastFrameTime = currentTime;
      animationId = requestAnimationFrame(measureScrollPerformance);
    };

    animationId = requestAnimationFrame(measureScrollPerformance);
    return () => cancelAnimationFrame(animationId);
  }, [enabled]);

  return scrollMetrics;
};

// Memory usage hook
export const useMemoryMonitor = (enabled = process.env.NODE_ENV === 'development') => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as PerformanceExtended).memory;
      setMemoryInfo({
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100, // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100 // MB
      });
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  return memoryInfo;
};