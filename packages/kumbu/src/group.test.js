// @ts-check

import { describe, it, expect } from 'bun:test';
import { HGroup, VGroup } from './group.js';
import { Canvas } from './canvas.js';
import { splitLines } from '@yowazi/rangi';
import { stringWidth } from '@yowazi/singi';

describe('HGroup / VGroup', () => {
  describe('HGroup - natural size', () => {
    it('should render children side-by-side with natural sizing', () => {
      const box1 = 'Box1\nLine2';
      const box2 = 'Box2';
      const group = new HGroup([box1, box2], { align: 'top' });
      const result = group.render();
      expect(result).toBeDefined();
      expect(result.length > 0).toBe(true);
    });

    it('should handle gap spacing', () => {
      const box1 = 'A';
      const box2 = 'B';
      const group = new HGroup([box1, box2], { gap: 1 });
      const result = group.render();
      // With gap of 1, should have a space between A and B
      expect(result.includes('A B')).toBe(true);
    });

    it('should handle empty children', () => {
      const group = new HGroup([]);
      expect(group.render()).toBe('');
    });
  });

  describe('HGroup - fixed width', () => {
    it('should distribute width equally among children', () => {
      const box1 = 'A';
      const box2 = 'B';
      const box3 = 'C';
      const group = new HGroup([box1, box2, box3], { width: 9 }); // 3 chars each
      const result = group.render();
      const lines = splitLines(result);
      // Each child should be 3 columns wide when lines are aligned
      for (const line of lines) {
        expect(stringWidth(line)).toBe(9);
      }
    });

    it('should distribute remainder to first children', () => {
      const box1 = 'A';
      const box2 = 'B';
      const group = new HGroup([box1, box2], { width: 5 }); // 2 + 3
      const result = group.render();
      const lines = splitLines(result);
      for (const line of lines) {
        expect(stringWidth(line)).toBe(5);
      }
    });
  });

  describe('VGroup - natural size', () => {
    it('should render children stacked vertically with natural sizing', () => {
      const box1 = 'Box1';
      const box2 = 'Box2\nLine2';
      const group = new VGroup([box1, box2], { align: 'left' });
      const result = group.render();
      expect(result).toBeDefined();
      expect(splitLines(result).length >= 2).toBe(true);
    });

    it('should handle gap spacing', () => {
      const box1 = 'A';
      const box2 = 'B';
      const group = new VGroup([box1, box2], { gap: 1 });
      const result = group.render();
      const lines = splitLines(result);
      // Should have 4 lines: A, gap, B, (possibly alignment padding)
      expect(lines.length >= 3).toBe(true);
    });
  });

  describe('VGroup - fixed height', () => {
    it('should distribute height equally among children', () => {
      const box1 = 'A';
      const box2 = 'B';
      const box3 = 'C';
      const group = new VGroup([box1, box2, box3], { height: 9 }); // 3 lines each
      const result = group.render();
      const lines = splitLines(result);
      expect(lines.length).toBe(9);
    });
  });

  describe('Nested groups', () => {
    it('should render nested HGroup inside VGroup', () => {
      const hgroup = new HGroup(['A', 'B']);
      const vgroup = new VGroup([hgroup, 'C']);
      const result = vgroup.render();
      expect(result).toBeDefined();
      expect(splitLines(result).length >= 2).toBe(true);
    });

    it('should render nested VGroup inside HGroup', () => {
      const vgroup = new VGroup(['A', 'B']);
      const hgroup = new HGroup([vgroup, 'C']);
      const result = hgroup.render();
      expect(result).toBeDefined();
    });
  });

  describe('renderToCanvas', () => {
    it('should place group result on canvas at specified position', () => {
      const canvas = new Canvas(20, 10);
      const group = new HGroup(['Box1', 'Box2']);
      group.renderToCanvas(canvas, 2, 1);

      const output = canvas.toANSI();
      // Row 1 should have content (non-empty)
      expect(output[1].length > 0).toBe(true);
    });
  });
});
