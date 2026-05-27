import http.server, socketserver, os
os.chdir("/Users/alex/Desktop/Market Tracker")
with socketserver.TCPServer(("", 3333), http.server.SimpleHTTPRequestHandler) as s:
    s.serve_forever()
