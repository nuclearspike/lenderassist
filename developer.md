command to create the package for the Chrome Web Store
find . -type f \( -name '*.css' -o -name '*.js' -o -name '*.html' -o -name '*.png' -o -name '*.json' \) | zip kla.zip -@
