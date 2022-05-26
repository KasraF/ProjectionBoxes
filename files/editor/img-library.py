from js import XMLHttpRequest

def download_file(filename):
	req = XMLHttpRequest.new()
	req.open('GET', '/editor/' + filename, False)
	req.responseType = 'arraybuffer'
	req.send(None)

	f = open(filename, 'wb')

	f.write(req.response.to_bytes())
	f.close()

download_file('cat.png')
