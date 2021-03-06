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
				"for _k_ in list(sys.modules['__main__'].__dict__.keys()):\n" +
				"\tif _k_ == '__start_env__': continue\n" +
				"\tif _k_ not in __start_env__:\n" +
				"\t\tdel sys.modules['__main__'].__dict__[_k_]\n" +
				"\telse:\n" +
				"\t\tsys.modules['__main__'].__dict__[_k_] = __start_env__[_k_]\n" +
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

let pyodide;

async function main() {
    console.log('Loading pyodide...');
    importScripts('pyodide/pyodide.js');
    pyodide = await loadPyodide({ indexURL: "pyodide/" });

    // Then, import the modules
    console.log('Importing python modules...');
    await pyodide.loadPackage(['numpy', 'Pillow']);
    await pyodide.runPythonAsync('import pyodide\nimport os\nimport sys\nimport io\n');

	// pyodide.loadPackage('CSE8AImage')

	console.log("Loading run.py and img-summary.py");
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
	await Promise.all([runpy, imgSummary]);

	// Store the load environment to use later.
	await pyodide.runPythonAsync(
			"__start_env__ = sys.modules['__main__'].__dict__.copy()");

	// Load the images used by the imaging library
    console.log('Loading cat image...');
    await pyodide.runPythonAsync(
		"pyodide.eval_code(pyodide.open_url(\"editor/img-library.py\").getvalue(), globals())");

	// Replace the console to forward Pyodide output to Monaco
	console.log('Sending LOADED message...');
	self.postMessage(new RTVRunPy(-1, ResponseType.LOADED, ''));

    console.log('Pyodide load complete.');
}
main()
