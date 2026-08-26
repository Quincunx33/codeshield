#!/usr/bin/env python3
import argparse, json, pathlib, sys, urllib.request

EXTENSIONS = {'.c', '.h', '.cc', '.cpp', '.cxx', '.hpp', '.py', '.java'}

def collect(root):
    files = []
    for path in pathlib.Path(root).rglob('*'):
        if path.is_file() and path.suffix.lower() in EXTENSIONS and '.git' not in path.parts:
            try: files.append({'path': str(path.relative_to(root)), 'content': path.read_text(encoding='utf-8', errors='replace')})
            except OSError: pass
    return files

def main():
    parser = argparse.ArgumentParser(description='CodeShield Mix scanner — scan anonymously; use --cookie only to save history and access account features')
    parser.add_argument('project', help='Project directory')
    parser.add_argument('--server', default='http://localhost:3000/api/trpc', help='Shared API base')
    parser.add_argument('--project-name', default=None)
    parser.add_argument('--json', dest='json_path', default=None, help='Write machine-readable report to this file')
    parser.add_argument('--cookie', default=None, help='Authenticated session cookie (or set CODESHIELD_COOKIE)')
    args = parser.parse_args()
    files = collect(args.project)
    if not files: print('No supported source files found.', file=sys.stderr); return 2
    payload = {'json': {'0': {'json': {'projectName': args.project_name or pathlib.Path(args.project).name, 'files': files}}}}
    headers = {'Content-Type': 'application/json'}
    cookie = args.cookie or __import__('os').environ.get('CODESHIELD_COOKIE')
    if cookie: headers['Cookie'] = cookie
    request = urllib.request.Request(args.server.rstrip('/') + '/scanner.run', data=json.dumps(payload).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=120) as response: raw = json.loads(response.read())
        report = raw.get('result', {}).get('data', {}).get('json') or raw
    except Exception as error:
        print(f'Unable to reach CodeShield API: {error}', file=sys.stderr); return 1
    if args.json_path: pathlib.Path(args.json_path).write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f"\nCodeShield Mix · {report.get('projectName', 'project')}\n{'─' * 58}")
    if not cookie: print("Anonymous scan · add --cookie only when saved history or team features are needed")
    print(f"Files scanned: {report.get('filesScanned', 0)}")
    summary = report.get('summary', {})
    for severity in ('critical', 'high', 'medium', 'low', 'info'): print(f"{severity.upper():<9} {summary.get(severity, 0)}")
    print(f"\nFindings: {len(report.get('findings', []))}")
    for item in report.get('findings', [])[:20]: print(f"[{item['severity'].upper():8}] {item['file']}:{item['line']}  {item['title']} — {item['message']}")
    if args.json_path: print(f"\nJSON report saved to {args.json_path}")
    return 0

if __name__ == '__main__': raise SystemExit(main())
