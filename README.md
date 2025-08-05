# 3d

A small 3d projector I wrote in an afternoon that takes 3d points and projects them onto a 2d screen.

# Features

This works in a different way than most 3d renderers, instead of determining the color of every pixel on the screen, it just projects every element in the scene onto the screen, and then draws the pixels that are visible. This means that it is very limited in what it can do, but it is very fast and simple.

## Only points

Due to the way it works, it can only render points, not lines, polygons, or models. Maybe there is way to do it other than reworking the renderer, but the question is if it is worth it.

# Demo

Live demo is available through github pages: [https://kariem816.github.io/3d/](https://kariem816.github.io/3d/)