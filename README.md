# Projection Boxes
A meta repository for the Projection Box projects.

## Content
1. [Setup](#setup)
2. [Modules](#modules)
3. [Building](#building)
4. [Running](#running)
5. [Deploying](#deploying)
6. [TODOs](#todos) 

## Setup
This repository contains the other repositories as Git Submodules. You can read about them in the [modules](#modules)
section if you're interested, but even if not, you need to initialize each git submodules, and build them in a
particular order _once_ before you can run `MonacoServer`. So, while you are reading the rest of this README, I 
highly recommend running the `init.fish` script provided in this meta-repository.

It initializes each git module, checks out the correct branch for each, and builds them in the right order. If you
run it now, hopefully you will have a ready-to-run local build by the end of this README!

## Modules
### Visual Studio Code
This is the repository for the original Visual Studio Code source. However, we only compile the
Monaco Editor sources from this. In particular, we use the files under `src/vs/editor/contrib/rtv/remote` rather
than their equivalents in `src/vs/editor/contrib/rtv`, and build with:   
```shell
yarn run gulp editor-distro
```
which creates the `monaco-editor-core` package used in...

### Monaco Editor
This repository is a simple npm package that combines all the sources necessary to create the web
version of the Monaco Editor using Webpack. However, to make it use our custom version of the `vscode` source code,
we need to link our build to this package, which is done with:
```
cd vscode/out-monaco-editor-core
yarn link
cd ../../monaco-editor
yarn link monaco-editor-core
```

### Monaco Server
This repository contains the web server that puts everything together and actually serves the files. See the `README` in
it that repository for an overview of its source code and how to build and run it.

## Building
Building everything from scratch involves the following steps:
1. Build `monaco-editor-core` from the `vscode` repository.
2. Build `monaco-editor` from the `monaco-editor` repository _using our build of_ `vscode`.
3. Build `MonacoServer` _using our build of_ `monaco-editor`.

We can skip steps #2 and #3 if the `vscode` source has not changed. However, if we change `vscode` we need to perform 
_both_ steps 2 and 3.

Since these steps are quite involved and compilation is slow, we can use another `fish` scripts provided in this meta
repository to rebuild: `build.fish` only performs steps #2-4, and assumes that those `npm` packages are already linked.

## Running
See the instructions in `MonacoEditor`'s `README` for running the server.

## Deploying
See the instructions in `MonacoEditor`'s `README` for deploying a build.

## TODOs
1. Figure out how to check out the branches without needing to manually go into each submodule and run `git checkout`.
2. Rewrite the `.fish` files in `bash`.
3. Configure GitHub actions (if we can get it for free) to build `pyodide`, and create a complete build on each commit.
   This could saves us a lot of work.
