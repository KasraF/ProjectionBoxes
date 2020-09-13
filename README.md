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
This repository contains the other repositories as Git Submodules. So, after cloning this repository, we need to 
initialized the other repositories with:

``` shell
git submodule update --init --remote
```

This should checkout the latest commit from the `pyodide` branches of each repository, and is sufficient if we only
want to build and run it. For development, however, we need to track those branches manually:

``` shell
cd monaco-editor && git checkout master && cd ../;
cd MonacoServer && git checkout pyodide-test && cd ../;
cd pyodide && git checkout master && cd ../;
cd vscode && git checkout pyodide-test && cd ../;
```

Then, we can develop each of the modules, and push the changes as with any regular git repository.

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

### Pyodide
This repository is a fork of `iodide-project/pyodide`, and contains the code for running Python directly
in the browser. The only changes in this fork (as of time writing) are for adding the `Pillow` python package, so
the [build instructions](https://pyodide.readthedocs.io/en/latest/building_from_sources.html) from the original 
repository should still work. Keep in mind that the build will take a very long time (more than an hour on my 
laptop), but if you install `ccache` as they recommend, subsequent builds should only take a few minutes. After
building, you can copy the files to the expected location with this command:
```shell
cd MonacoServer/src/main/resources/static/pyodide
cp -r ../../../../../../pyodide/build/* .
git checkout webworker.js # Checkout the webworker again, because we modified it
```

### Monaco Server
This repository contains the web server that puts everything together and actually serves the files. See the `README` in
it that repository for an overview of its source code and how to build and run it.

## Building
Building everything from scratch involves the following steps:
1. Build `pyodide` and copy the build files to `MonacoServer`. 
2. Build `monaco-editor-core` from the `vscode` repository.
3. Build `monaco-editor` from the `monaco-editor` repository _using our build of_ `vscode`.
4. Build `MonacoServer` _using our build of_ `monaco-editor`.

Since it's unlikely that we need to change `pyodide`, for subsequent rebuilds we can skip step #1. Similarly, we can
skip steps #2 and #3 if the `vscode` source has not changed. However, if we change `vscode` we need to perform _both_
steps 2 and 3.

Since these steps are quite involved and compilation is slow, we can use the `fish` scripts provided in this meta
repository to build and rebuild:

1. `init.fish` builds _everything_ assuming no previous builds exists. Run this _once_ after checkout out all the
   submodules.
2. `build.fish` only performs steps #2-4, and assumes that those `npm` packages are already linked.

## Running
See the instructions in `MonacoEditor`'s `README` for running the server.

## Deploying
See the instructions in `MonacoEditor`'s `README` for deploying a build.

## TODOs
1. Figure out how to check out the branches without needing to manually go into each submodule and run `git checkout`.
2. Rewrite the `.fish` files in `bash`.
3. Configure GitHub actions (if we can get it for free) to build `pyodide`, and create a complete build on each commit.
   This could saves us a lot of work.
