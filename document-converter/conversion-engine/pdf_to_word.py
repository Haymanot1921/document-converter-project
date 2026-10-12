import sys
from pathlib import Path
from pdf2docx import Converter

def main(source_arg: str, destination_arg: str) -> None:
    source = Path(source_arg).resolve()
    destination = Path(destination_arg).resolve()
    if not source.is_file() or source.suffix.lower() != ".pdf":
        raise ValueError("Input must be an existing PDF file")
    destination.parent.mkdir(parents=True, exist_ok=True)
    converter = Converter(str(source))
    try:
        converter.convert(str(destination))
    finally:
        converter.close()
    if not destination.is_file() or destination.stat().st_size == 0:
        raise RuntimeError("DOCX output was not created")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: pdf_to_word.py input.pdf output.docx")
    main(sys.argv[1], sys.argv[2])
