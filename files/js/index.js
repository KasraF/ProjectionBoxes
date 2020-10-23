import * as monaco from 'monaco-editor';
import * as $ from 'jquery';

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		if (label === 'json') {
			return './json.worker.bundle.js';
		}
		if (label === 'css') {
			return './css.worker.bundle.js';
		}
		if (label === 'html') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
}

$(function() {
	window.editor = monaco.editor.create(
		document.getElementById('editor'), 
		{
			value: "def avg(l):\n" +
			       "    s = 0\n" +
			       "    for x in l:\n" +
			       "        s = s + x\n" +
			       "    n = len(l)\n" +
			       "    return s / n\n\n" +
			       "k = avg([1, 5, 6, 10])\n",
			language: 'python',
			theme: 'vs-dark',
			automaticLayout: true,
			fontSize: 15,
			minimap: {
				enabled: false
			}
		});
});
