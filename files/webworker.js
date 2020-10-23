/**
 * This webworker will be spawned once on page load, and will handle queries of the RTVRunPy class.
 */

const RequestType = {
	RUNPY: 1,
	IMGSUM: 2
}

const ResponseType = {
	// Responses related to the running program
	STDOUT: 1,
	STDERR: 2,
	RESULT: 3,
	EXCEPTION: 4,

	// Responses related to the web worker itself
	ERROR: 5,
	LOADED: 6
}

class RTVRunPy {
	constructor(id, type, msg) {
		this.id = id;
		this.type = type;
		this.msg = msg;
	}
}

//console.log("Creating new console...");
// self.languagePluginUrl = 'https://monaco.goto.ucsd.edu/pyodide/';
// self.languagePluginUrl = 'https://editor.weirdmachine.me/pyodide/';
// self.languagePluginUrl = 'http://lvh.me:8080/pyodide/';
self.languagePluginUrl = 'pyodide/';
console.log("Importing Pyodide script...");
importScripts('./pyodide/pyodide.js');
languagePluginLoader
	.then(() => {
		console.log("Importing Numpy and Pillow...");
		return Promise.all([pyodide.loadPackage('numpy'), pyodide.loadPackage('Pillow')]);
	})
	.then(() => {
		console.log("Importing pyodide and os...");
		return pyodide.runPythonAsync('import pyodide\nimport os\n');
	})
	.then(() => {
		console.log("Loading core.py, run.py, and img-summary.py");
		const runpy = pyodide.runPythonAsync(
			'import pyodide\n' +
			'import os\n' +
			'import sys\n' +
			'import io\n' +
			'runpy = open("run.py", "w")\n' +
			'runpy.write(pyodide.open_url("editor/run.py").getvalue())\n' +
			'runpy.close()');
		const imgSummary = pyodide.runPythonAsync(
			'import pyodide\n' +
			'import os\n' +
			'img_summary = open("img-summary.py", "w")\n' +
			'img_summary.write(pyodide.open_url("editor/img-summary.py").getvalue())\n' +
			'img_summary.close()');
		return Promise.all([runpy, imgSummary]);
	})
	.then(() => {
		// Store the load environment to use later.
		return pyodide.runPythonAsync(
			"__start_env__ = sys.modules['__main__'].__dict__.copy()");
	})
	.then(() => {
		// Replace the console to forward Pyodide output to Monaco
		self.postMessage(new RTVRunPy(-1, ResponseType.LOADED, ''));
	});

self.onmessage = function (msg) {
	const id = msg.data.id;

	switch (msg.data.type) {
		case RequestType.RUNPY:
		{
			const name = msg.data.name;
			let content = msg.data.content;

			while (content.includes('"""')) {
				content = content.replace('"""', '\\"\\"\\"');
			}

			const clearEnv =
				"for k in list(sys.modules['__main__'].__dict__.keys()):\n" +
				"\tif k == '__start_env__': continue\n" +
				"\tif k not in __start_env__:\n" +
				"\t\tdel sys.modules['__main__'].__dict__[k]\n" +
				"\telse:\n" +
				"\t\tsys.modules['__main__'].__dict__[k] = __start_env__[k]\n" +
				"import sys\n";

			const runPy =
				`sys.stdout = io.StringIO()\n` +
				`sys.stderr = io.StringIO()\n` +
				`program = """${content}\n"""\n` +
				`code = open("${name}", "w")\n` +
				`code.write(program)\n` +
				`code.close()\n` +
				`run = open("run.py", "r")\n` +
				`pyodide.eval_code(run.read() + "\\nmain(\'${name}\')\\n", {})`;

			const readStd = `sys.stdout.getvalue()`;
			const readErr = `sys.stderr.getvalue()`;
			const readOut =
				`if os.path.exists("${name}.out"):\n` +
				`\tfile = open("${name}.out")\n` +
				`\trs = file.read()\n` +
				`\tos.remove("${name}.out")\n` +
				`else:\n` +
				`\t rs = ""\n` +
				`rs`;
			const cleanup =
				`if os.path.exists("${name}"):\n` +
				`\tos.remove("${name}")`;

			pyodide.runPythonAsync(clearEnv)
				.then(() => {
					return pyodide.runPythonAsync(runPy);
				})
				.then(() => {
					// Read Stdout and Stderr in any order
					return Promise.all([
						pyodide.runPythonAsync(readStd).then((out) => self.postMessage(new RTVRunPy(id, ResponseType.STDOUT, out))),
						pyodide.runPythonAsync(readErr).then((err) => self.postMessage(new RTVRunPy(id, ResponseType.STDERR, err))),
					]);
				})
				.then(() => {
					// Read the output
					return pyodide.runPythonAsync(readOut);
				})
				.then((out) => {
					self.postMessage(new RTVRunPy(id, ResponseType.RESULT, out));
				})
				.catch((err) => {
					// Send the exception first
					self.postMessage(new RTVRunPy(id, ResponseType.EXCEPTION, err.toString()));

					// Then send the outputs
					Promise
						.all([
							pyodide.runPythonAsync(readStd).then((out) => self.postMessage(new RTVRunPy(id, ResponseType.STDOUT, out))),
							pyodide.runPythonAsync(readErr).then((err) => self.postMessage(new RTVRunPy(id, ResponseType.STDERR, err)))])
						.then(() => pyodide.runPythonAsync(readOut))
						.then((out) => self.postMessage(new RTVRunPy(id, ResponseType.RESULT, out)));
				})
				.finally(() => {
					return pyodide.runPythonAsync(cleanup);
				});
			}
			break;
		case RequestType.IMGSUM:
		{
			const name = msg.data.name;
			let content = msg.data.content;
			let line = msg.data.line;
			let varname = msg.data.varname;

			while (content.includes('"""')) {
				content = content.replace('"""', '\\"\\"\\"');
			}

			const runPy =
				`program = """${content}"""\n` +
				`code = open("${name}", "w")\n` +
				`code.write(program)\n` +
				`code.close()\n` +
				`img_summary = open("img-summary.py", "r")\n` +
				`pyodide.eval_code(img_summary.read() + "\\nmain(\'${name}\', \'${line}\', \'${varname}\')\\n", {})`;
			const readOut = `if os.path.exists("${name}.out"):\n` +
				`\tfile = open("${name}.out")\n` +
				`\trs = file.read()\n` +
				`\tos.remove("${name}.out")\n` +
				`else:\n` +
				`\t rs = ""\n` +
				`rs`;
			const cleanup =
				`if os.path.exists("${name}"):\n` +
				`\tos.remove("${name}")`;

			pyodide.runPythonAsync(runPy)
				.then(() => {
					// Read output
					return pyodide.runPythonAsync(readOut);
				})
				.then((out) => {
					self.postMessage(new RTVRunPy(id, ResponseType.RESULT, out));
				})
				.catch((err) => {
					self.postMessage(new RTVRunPy(id, ResponseType.EXCEPTION, err.toString()));
				})
				.finally(() => {
					return pyodide.runPythonAsync(cleanup);
				});
			}
			break;
		default:
			self.postMessage(new RTVRunPy(id, ResponseType.ERROR, 'Unrecognized request: ' + msg));
	}
}