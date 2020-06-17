#!/usr/bin/fish
cd vscode
and yarn run gulp editor-distro
and cd out-monaco-editor-core
and yarn link
and cd ../../monaco-editor
and yarn link monaco-editor-core
and yarn release
and cd release
and yarn link
and cd ../../MonacoServer/src/main/javascript/
and yarn build