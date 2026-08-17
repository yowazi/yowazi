# Yowazi - Clear, compiled TUIs.

Yowazi is a series of packages and tools for creating TUIs (terminal user interfaces).

The use of `bun` is a very deliberate choice as it can compile NodeJS tools to binaries with runtime sizes of around 65-70MB. Significantly larger than `go` or `rust`, but in a language that is more accessible to developers. Yowazi is inspired by the _glamorous_ **Bubbletea** framework for `go`.

Other frameworks, like `ink` exist, but forces a web paradigm (React) on the creation of cli tools. Such frameworks often have many dependencies and a core design goal of `yowazi` is zero-dependencies, aside from some dev dependencies required in the resulting apps.

Because naming is hard, I chose Yowazi from the Swahili language. It means `clearly|clarity` (some translations says "you know"). The rest of the packages adopts Swahili words (or modified versions) for package names.

---

## Yowazi break-down

| Layer | Package | Origin | What it does | Status |
|-------|---------|--------|--------------|------|
| Primitives | @yowazi/singi | "msingi" - foundation | Terminal I/O: ANSI, raw mode, input decoding | - |
| Styling | @yowazi/rangi | "rangi" - color, paint | Visual styling: colors, borders, padding, semantic themes | - |
| Runtime | @yowazi/kini | "kiini" - nucleus, core | Application engine: ELM architecture, init/update/view, command and queue | - |
| Components | @yowazi/semu | "sehemu" - part, piece | Reusable components: spinner, text input, lists, modals | - |
| UI Testing | @yowazi/picha | "picha" - picture, photograph | Design-first snapshots: capture, compare, multi-theme regressions | - |
| SSH Deployment | @yowazi/kibali | "kibali" - permit, permission | SSH service: composable middleware, public-key auth, context handling | - |
| Example | @yowazi/hariri | "hariri" - edit | ASCII art editor: a yowazi demonstration application | - |

## Core design

### ELM-inspired Model/Update/View

Applications built using `@yowazi/kini` follows a composable pattern:

```js
{
  init()              -> [state, commands[]]
  update(msg, state)  -> [newState, commands[]]
  view(state)         -> renderedOutput
}
```

No side effects in `update` or `view`. Compose using a `Cmd.map()`.

### Zero Dependencies

All packages are pure JavaScript - no external runtime dependencies, no build process. Raw ANSI processing, plain `JavaScript` and `JSDoc` type hints. `bun` can run directly.

### Theme System

ANSI based themes are complex, so themes are designed around semantic naming: `{fg|bg}_default`, `{fg|bg}_primary`, `{fg|bg}_secondary`, `{fg|bg}_alert`, `{fg|bg}_warning`, `{fg|bg}_error`.

`.meta.json` files used to map chosen colors to a semantic name for themed overrides.

## What can you do with Yowazi?

* **TUI Apps** - Full interactive terminal applications compiled as binaries.
* **CLI Tools** - Rich command-line experiences.
* **Live Dashboards** - Real-time monitoring TUIs.
* **Text Games** - Terminal based games to run locally or over SSH.
* **SSH Deployment** - Host TUI applications over SSH with built-in key based authentication.
* **Visual Testing** - Use `@yowazi/picha` as a stand-alone tool to do UI-based testing for your existing TUI frameworks.

## Contributing

Yowazi is a green field project. Contributions, feedback, real-world use cases welcome!

## License 

MIT
