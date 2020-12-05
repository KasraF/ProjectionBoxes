#!/usr/bin/fish
set _pwd (pwd)
set _log "$_pwd/build.log";

cd vscode
and echo "Rebuiling VSCode:"
and echo "  Building the editor-distro..."
and yarn run gulp editor-distro >> "$_log"
and cd out-monaco-editor-core
and echo "  Linking monaco-editor-core..."
and yarn link >> "$_log"
and echo "  VSCode build succeeded!"
and cd ../../monaco-editor
and echo "Rebuilding Monaco Editor:"
and echo "  Cleaning the release directory..."
and rm -rf ./release
and echo "  Linking monaco-editor-core..."
and yarn link monaco-editor-core >> "$_log"
and echo "  Building monaco-editor..."
and yarn release >> "$_log"
and cd release
and echo "  Linking monaco-editor..."
and yarn link >> "$_log"
and echo "  Monaco Editor build succeeded!"
and cd ../../files/
and if test ! -d pyodide;
	echo "Downloading pyodide...";
	wget 'https://github.com/KasraF/pyodide/releases/download/monaco/pyodide_with_pillow.zip';
	and unzip -d pyodide pyodide_with_pillow.zip;
	and rm pyodide_with_pillow.zip;
	echo "Pyodide done."
end;
and echo "Putting everything together:"
and yarn build
and yarn package
and cd release
and http-server .
