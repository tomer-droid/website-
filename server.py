#!/usr/bin/env python3
"""Minimal static file server for the Kamir Group site.

Avoids os.getcwd() (blocked under the preview sandbox) by binding the
SimpleHTTPRequestHandler to an absolute directory explicitly.
"""
import functools
import http.server
import os
import socketserver

DIRECTORY = "/Users/kamir/Desktop/אתר לחברה"
PORT = int(os.environ.get("PORT", "5050"))

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving {DIRECTORY} on http://localhost:{PORT}")
    httpd.serve_forever()
