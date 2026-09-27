#!/usr/bin/env python3
"""
Simple HTTP Server for Flood & Traffic Monitoring Dashboard
ศูนย์ติดตามสถานการณ์น้ำและกล้องวงจรปิด (กทม. นนทบุรี ปทุมธานี)
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for live dashboard development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server(port=PORT):
    for p in range(port, port + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                url = f"http://localhost:{p}"
                print("=" * 65)
                print(f"🌊 Flood & Traffic Monitoring Dashboard Server is running!")
                print(f"🌐 Dashboard URL: {url}")
                print(f"📁 Root Directory: {DIRECTORY}")
                print(f"⚡ Press Ctrl+C to stop the server.")
                print("=" * 65)
                
                # Try opening browser if in interactive mode
                if "--open" in sys.argv or "-o" in sys.argv:
                    webbrowser.open(url)
                    
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {p} is in use, trying next port...")

if __name__ == '__main__':
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run_server(port)
