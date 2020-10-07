#!/usr/bin/fish
set _root $root;
set root (pwd);

# Set up git
git submodule update --init --remote

# Build vscode
and echo
and echo
and echo "====================================================================================="
and echo "==                               Visual Stdio Code                                 =="
and echo "====================================================================================="
and echo
and cd $root/vscode
and git checkout pyodide-test
and yarn
and yarn compile
and yarn run gulp editor-distro
and cd out-monaco-editor-core
and yarn link

# Build Monaco Editor
and echo
and echo
and echo "====================================================================================="
and echo "==                                 Monaco Editor                                   =="
and echo "====================================================================================="
and echo
and cd $root/monaco-editor
and git checkout master
and yarn link monaco-editor-core
and yarn
and yarn release
and cd release
and yarn link

# Build MonacoServer
and echo
and echo
and echo "====================================================================================="
and echo "==                                 Monaco Server                                   =="
and echo "====================================================================================="
and echo
and cd $root/MonacoServer
and git checkout master
and yarn
and yarn build
and echo "Downloading the pyodide build..."
and cd src/main/resources/static/pyodide
and wget "https://github.com/KasraF/pyodide/releases/download/monaco/pyodide_with_pillow.zip"
and unzip pyodide_with_pillow.zip
and rm pyodide_with_pillow.zip
and cd $root/MonacoServer
and echo "Done!"
and mvn clean install
and cd $root
and set root $_root
and exit;
