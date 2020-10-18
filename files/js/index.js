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
			value: "def sort(l):\n" +
				"\tr = []\n" +
				"\tfor x in l:\n" +
				"\t\tfor i,y in enumerate(r):\n" +
				"\t\t\t\n" +
				"\treturn r\n\n" +
				"sort([8,2,7])",
			language: 'python',
			theme: 'vs-dark',
			automaticLayout: true,
			fontSize: 15,
			minimap: {
				enabled: false
			}
		});
});