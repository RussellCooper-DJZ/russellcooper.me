# Performance Optimization Notes

## Overview
This document tracks performance improvements and optimization strategies for the portfolio site.

## Lighthouse Score Targets
- Performance: ≥ 95
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Implemented Optimizations
- [x] Lazy loading for images
- [x] Code splitting via dynamic imports
- [x] Service Worker caching strategy
- [x] Preconnect to external domains

## Pending Improvements
- [ ] Implement Critical CSS inlining
- [ ] Add resource hints (prefetch/preload)
- [ ] Optimize font loading with `font-display: swap`
- [ ] Reduce Cumulative Layout Shift (CLS) to < 0.1
