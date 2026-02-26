import sys
from pathlib import Path

def detect_encoding(b):
    if b.startswith(b"\xff\xfe") or b.startswith(b"\xfe\xff"):
        return 'utf-16'
    if b.startswith(b"\xef\xbb\xbf"):
        return 'utf-8-sig'
    try:
        b.decode('utf-8')
        return 'utf-8'
    except Exception:
        return 'latin-1'


def convert(in_path, out_path):
    p = Path(in_path)
    if not p.exists():
        print(f"Input file not found: {in_path}")
        return 2
    data = p.read_bytes()
    enc = detect_encoding(data)
    print(f"Detected encoding: {enc}")
    text = data.decode(enc)
    out = Path(out_path)
    out.write_text(text, encoding='utf-8')
    print(f"Wrote UTF-8 file: {out_path}")
    return 0

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_fixture_encoding.py input.json output.json")
        sys.exit(1)
    sys.exit(convert(sys.argv[1], sys.argv[2]))
