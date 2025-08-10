import sys
import io
import json
import os
from PIL import Image
import urllib.parse

# Force stdout/stderr to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

target_color = (255, 0, 255)  # #FF00FF magenta


def contains_color(image_path, target):
    try:
        img = Image.open(image_path).convert('RGB')
        pixels = img.load()
        width, height = img.size
        for x in range(width):
            for y in range(height):
                if pixels[x, y] == target:
                    return True
        return False
    except Exception as e:
        print(f"Error reading {image_path}: {e}", file=sys.stderr)
        return False


def scan_sequence_folder(seq_path):
    if not os.path.isdir(seq_path):
        print(
            f"Warning: Sequence folder does not exist: {seq_path}", file=sys.stderr)
        return False

    for file_name in os.listdir(seq_path):
        if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.tif', '.tga')):
            file_path = os.path.join(seq_path, file_name)
            if contains_color(file_path, target_color):
                return True
    return False


def main():
    if len(sys.argv) < 3:
        print("Usage: python scan_sequences.py <input_json> <output_json>",
              file=sys.stderr)
        sys.exit(1)

    input_json = sys.argv[1]
    output_json = sys.argv[2]

    try:
        with open(input_json, 'r', encoding='utf-8') as f:
            selected_paths = json.load(f)
    except Exception as e:
        print(f"Error reading input JSON: {e}", file=sys.stderr)
        sys.exit(1)

    found_sequences = []

    for path in selected_paths:
        decoded_path = urllib.parse.unquote(path)
        seq_folder = os.path.dirname(decoded_path)
        found_sequences.append(seq_folder)
        print(f"Scanning folder: {seq_folder}")

        if scan_sequence_folder(seq_folder):
            seq_name = os.path.basename(seq_folder)
            found_sequences.append(seq_name)
        else:
            found_sequences.append(
                f'{len(os.listdir(seq_folder))} : {scan_sequence_folder(seq_folder)}')

    # Make sure output directory exists
    output_dir = os.path.dirname(output_json)
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
        except Exception as e:
            print(
                f"Error creating output directory '{output_dir}': {e}", file=sys.stderr)
            sys.exit(1)

    try:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(found_sequences, f, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing output JSON: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
