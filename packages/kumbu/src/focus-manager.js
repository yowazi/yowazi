// @ts-check

/**
 * @typedef {import('./component').Component} Component
 */

/**
 * FocusManager: tracks tab order and the currently focused component in a component tree.
 *
 * Focus order is determined via depth-first traversal of Component.getChildren(),
 * filtered to only focusable (isFocusable(props) === true) leaves. Containers
 * (like HGroup/VGroup) are transparent to the focus order — they don't appear in the
 * order themselves, but they do appear in every descendant's ancestor path, allowing
 * ancestors to handle events their descendants decline.
 */
export class FocusManager {
  constructor() {
    /** @type {Component[]} - Flat list of focusable components in declaration order */
    this.order = [];

    /** @type {Component | null} - Currently focused component, or null if nothing is focusable */
    this.focused = null;

    /** @type {Map<Component, Component[]>} - Maps each component to [root, ...ancestors, component] */
    this.paths = new Map();

    /** @type {Component | null} - Cached root component for getFocusPath() */
    this.root = null;

    /** @type {boolean} - Whether focus was intentionally cleared (preserve null across refresh) */
    this.intentionallyUnfocused = false;
  }

  /**
   * Recompute the focus order and ancestor paths by traversing the component tree.
   *
   * Preserves current focus if the focused component is still present in the new tree.
   * Otherwise, focuses the first focusable component, or null if none exist.
   *
   * Safe to call every frame — cheap for TUI-scale trees.
   *
   * @param {Component} rootComponent - Root of the component tree
   * @param {Record<string, any>} [props={}] - Props to pass when calling getChildren/isFocusable
   */
  refresh(rootComponent, props = {}) {
    this.root = rootComponent;
    this.order = [];
    this.paths.clear();

    // DFS to build order and ancestor paths
    const walk = (component, ancestors) => {
      const path = [...ancestors, component];
      this.paths.set(component, path);

      if (component.isFocusable(props)) {
        this.order.push(component);
      }

      const children = component.getChildren(props) || [];
      for (const child of children) {
        walk(child, path);
      }
    };

    walk(rootComponent, []);

    // Preserve current focus if it's still in the new order; otherwise reset to first
    if (this.focused && this.order.includes(this.focused)) {
      // Focus is still valid — keep it
      this.intentionallyUnfocused = false;
    } else if (this.intentionallyUnfocused) {
      // Focus was intentionally cleared — preserve null (don't auto-reset)
    } else {
      // Focus is gone or order is empty — reset to first focusable or null
      this.focused = this.order.length > 0 ? this.order[0] : null;
    }
  }

  /**
   * Get the current focus order (flat list of focusable components).
   * @returns {Component[]}
   */
  getOrder() {
    return this.order;
  }

  /**
   * Get the currently focused component.
   * @returns {Component | null}
   */
  getFocused() {
    return this.focused;
  }

  /**
   * Get the path from root to the currently focused component (or just [root] if nothing is focused).
   * Always includes the root, even if no component is focusable.
   *
   * This is used for keyboard event routing: the path is replayed leaf-to-root, with the
   * first component to return a non-null message winning (and ancestors getting to bubble
   * up any declined key).
   *
   * @returns {Component[]}
   */
  getFocusPath() {
    if (!this.root) return [];
    if (!this.focused) return [this.root];
    return this.paths.get(this.focused) || [this.root];
  }

  /**
   * Set focus to a specific component (no-op if the component is not in the current order).
   * @param {Component} component
   */
  focus(component) {
    if (this.order.includes(component)) {
      this.focused = component;
      this.intentionallyUnfocused = false;
    }
  }

  /**
   * Clear focus — no component will be focused.
   * Useful when you want to deactivate all inputs without selecting a specific one.
   * The unfocused state is preserved across refresh() calls.
   */
  unfocus() {
    this.focused = null;
    this.intentionallyUnfocused = true;
  }

  /**
   * Advance focus to the next component in the tab order (wrap-around).
   * No-op if the order is empty.
   *
   * @returns {Component | null} - The newly focused component, or null if nothing is focusable
   */
  next() {
    if (this.order.length === 0) return null;

    const currentIdx = this.focused ? this.order.indexOf(this.focused) : -1;
    const nextIdx = (currentIdx + 1) % this.order.length;
    this.focused = this.order[nextIdx];
    return this.focused;
  }

  /**
   * Retreat focus to the previous component in the tab order (wrap-around).
   * No-op if the order is empty.
   *
   * @returns {Component | null} - The newly focused component, or null if nothing is focusable
   */
  previous() {
    if (this.order.length === 0) return null;

    const currentIdx = this.focused ? this.order.indexOf(this.focused) : 0;
    const prevIdx = (currentIdx - 1 + this.order.length) % this.order.length;
    this.focused = this.order[prevIdx];
    return this.focused;
  }
}
