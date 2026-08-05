# Parallax Glass compositions

The registry keeps the optical primitive and animated compositions as separate
installation boundaries.

| Registry item | Motion | Includes |
| --- | --- | --- |
| `liquid-glass` | No | Stable optical primitive and local material/refraction source |
| `liquid-glass-icon-pill` | No | Circular icon-action composition |
| `liquid-glass-magnetic-pointer` | No | Fine-pointer magnetic attraction, press deformation and spring return |
| `liquid-glass-navigation` | Yes | Draggable segmented navigation, rubber bounds, nearest-item spring snap |
| `liquid-glass-capsule` | Yes | Free drag, press squish, velocity deformation, optional spring leash hook |
| `liquid-glass-menu` | Yes | Compound morph menu, dynamic glass shell, hover fill and dismiss behavior |

Motion is not required by the refraction engine. It is declared only by items
whose source implementation uses Motion values or springs. A consumer that only
installs `liquid-glass` or `liquid-glass-icon-pill` does not install Motion.

The magnetic pointer is also Motion-free. It uses a local
`requestAnimationFrame` spring integrator and an embedded cursor SVG, so it does
not require a public asset path. Mount `<IOSPointer />` once near the application
root, then mark targets with `data-ios-pointer-target` (or use the attributes
already emitted by the menu parts).

Application concerns such as site headers, translations, framework navigation,
smooth scrolling, icon libraries and concrete links are intentionally outside
the registry boundary. Consumers compose those concerns around the generic
navigation and menu primitives.

## Why the animated items retain Motion

The same effects can be implemented without Motion, but not as a dependency
deletion. Menu expansion coordinates width, height, radius, offset, blur and
content transitions. Navigation snapping also coordinates pointer capture,
bounded overshoot, nearest-item selection and spring settling. Replacing that
runtime requires a new animation implementation and separate parity work.

The registry therefore preserves the validated interaction behavior and uses
item-level `motion` dependencies. This does not create a private runtime: all
Parallax Glass primitive and composition source is copied into the consumer.
