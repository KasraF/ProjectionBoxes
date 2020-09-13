#!/usr/bin/fish
set _root $root;
set root (pwd);

# Build Pyodide
cd $root/pyodide
and echo "\n\n====================================================================================="
and echo "==                                    Pyodide                                      =="
and echo "====================================================================================="
and make
and cd $root/MonacoServer/src/main/resources/static/pyodide
and cp -r $root/pyodide/build/* .
and git checkout webworker.js # Checkout the webworker again, because we modified it

# Build vscode
and echo "\n\n====================================================================================="
and echo "==                               Visual Stdio Code                                 =="
and echo "====================================================================================="
and cd $root/vscode
and yarn
and yarn compile
and yarn run gulp editor-distro
and cd out-monaco-editor-core
and yarn link

# Build Monaco Editor
and echo "\n\n====================================================================================="
and echo "==                                 Monaco Editor                                   =="
and echo "====================================================================================="
and cd $root/monaco-editor
and yarn link monaco-editor-core
and yarn
and yarn release
and cd release
and yarn link

# Build MonacoServer
and echo "\n\n====================================================================================="
and echo "==                                 Monaco Server                                   =="
and echo "====================================================================================="
and cd $root/MonacoServer
and yarn
and yarn build
and cd $root
and set root $_root
and exit;
