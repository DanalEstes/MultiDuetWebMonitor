#!/bin/sh
# Build script for Duet Web Control
#
# licensed under the terms of the GNU Public License v3,
# derived from build.sh written by Christian Hammacher 2016-2017 for DWC
# rewritten for Multi Duet Web Control by Danal Estes (c) 2018
#
# The following tools are required:
# - yui-compressor from https://yui.github.io/yuicompressor
# - UglifyJS from https://github.com/mishoo/UglifyJS
# - gzip utility
# Make sure all tools are accessible via your PATH environment variable!

# Optional paths to the required tools
YUI_COMPRESSOR=yui-compressor
UGLIFYJS=uglifyjs
GZIP=gzip

# Check for required tools
if [[ ! $(type $YUI_COMPRESSOR 2>/dev/null) ]]; then
	echo "yui-compressor not found in PATH!"
	#exit
fi

if [[ ! $(type $UGLIFYJS 2>/dev/null) ]]; then
	echo "uglifyjs not found in PATH!"
	#exit
fi

if [[ ! $(type $GZIP 2>/dev/null) ]]; then
	echo "gzip not found in PATH!"
	exit
fi

# Core directory must contain Multi.htm
if [ -f !"./core/Multi.htm" ] ; then
	echo "core directory doesn't contain Multi.htm"
	exit
fi

# Get the current version
VERSION=$(perl -nle 'print $1 if /MultiDWMC Web Interface Version.*(\d.\d\d).*/' ./core/Multi.htm )

# Create an empty build directory and clean up
if [ -d "./build" ] ; then
	rm -r ./build
fi
mkdir ./build
rm -f ./DuetMultiWebControl-*.zip

echo "=> Building compressed Duet Multi Web Control v$VERSION bundle"

# Copy HTML files and change CSS and JS rels
echo "Changing CSS and JS paths"
cp ./core/Multi.htm ./build/Multi.htm
cp ./core/html404.htm ./build/html404.htm
sed -i "/<link href/d" ./build/Multi.htm
sed -i "/<script src/d" ./build/Multi.htm
sed -i "/<!-- CSS/a	<link href=\"css/dwc.css\" rel=\"stylesheet\">" ./build/Multi.htm
sed -i "/<!-- Placed/a <script src=\"js/MultiDWMC.js\"></script>" ./build/Multi.htm

# Compress HTML files
echo "Compressing HTML file"
$GZIP -c ./build/Multi.htm > ./build/Multi.htm.gz
rm ./build/Multi.htm

# Concatenate JS files. They could be minified as well, but that would make debugging rather tricky
echo "Minifying and concatenating JS files"
mkdir ./build/js
echo "var dwcVersion = \"$VERSION\";" > ./build/js/MultiDWMC.js

JS_FILES=$(grep -e "\.js" ./core/Multi.htm | cut -d '"' -f 2 | sed -e 's/^/core\//' | tr '\n' ' ')
for FILE in $JS_FILES; do
	if [[ $FILE == "core/js/3rd-party/"* ]]; then
		echo "- Minifying $FILE..."
		#cat $FILE | $UGLIFYJS -c -m --keep-fnames >> ./build/js/MultiDWMC.js
		cat $FILE >> ./build/js/MultiDWMC.js
	else
		echo "- Appending $FILE..."
		cat $FILE >> ./build/js/MultiDWMC.js
	fi
done

# Compress minified JS file
echo "Compressing JS file"
$GZIP -c ./build/js/MultiDWMC.js > ./build/js/MultiDWMC.js.gz
rm ./build/js/MultiDWMC.js

# Now build DWC for wired Duets
echo "=> Building final Duet Multi Web Control package"
cd ./build
zip -r -o ../DuetMultiWebControl-$VERSION.zip ./*
cd ..

# Clean up again
rm -r ./build
echo "Done"
