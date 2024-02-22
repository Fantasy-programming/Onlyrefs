# Onlyrefs

GOAL:: Save images, gif, videos, store them offline in another dir ? and present them in "boards"

Create an open interface (Where do we land when we open the app).

FIst put dummy images linearly in a flex or grid. Then work on the drop logic. When we drop an image on the grid, it should show up, whitout being strored for a start.

If it works, then try storing the images and fetching from the storage on the app launch (choose location for windows, linux, fuck macos). I'm thinking of something like

Board dictionary key -> bord with key (id of file) and value (object with attributes)

Store the whole thing in a sqlite db or whatever

Now refine the image interface to be a mansonry grid, try to abstract all the boards and co.. without images into components.

The first thing i want it to be (v1) able to do is to save the image, gif, videos i give it, store them, and present them in boards of my convenience. (Make is useful)
