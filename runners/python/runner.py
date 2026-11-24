import json
import os
import sys


def main():
  request = json.load(sys.stdin)
  code = request['code']
  args = request['args']

  if not isinstance(code, str):
    raise ValueError('code must be a string')
  if not isinstance(args, list) or not all(isinstance(arg, str) for arg in args):
    raise ValueError('args must be a list of strings')

  # Replace the runner so the solution's exit code and signals pass through.
  os.execv(sys.executable, [sys.executable, '-I', '-B', '-c', code, *args])


if __name__ == '__main__':
  main()
