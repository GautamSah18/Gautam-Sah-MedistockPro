import cv2
import pytesseract
import re
from difflib import SequenceMatcher


pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# --------------------------------------------------
# Normalize Nepali Digits
# --------------------------------------------------
def normalize_nepali_digits(text):
    nepali_to_english = {
        "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
        "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"
    }

    for nep, eng in nepali_to_english.items():
        text = text.replace(nep, eng)

    return text


# --------------------------------------------------
# Strong Name Cleaning
# --------------------------------------------------
def clean_name(text):
    if not text:
        return None

    nepali_chars = re.findall(r"[\u0900-\u097F]+", text)

    if not nepali_chars:
        return None

    name = "".join(nepali_chars)


    name = name.lstrip("ःयरथनम")

    return name.strip()


# --------------------------------------------------
# OCR Extraction
# --------------------------------------------------
def extract_text(image_path):

    img = cv2.imread(image_path)

    # Resize for better OCR
    img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    text = pytesseract.image_to_string(
        thresh,
        lang="eng+nep",
        config="--psm 6"
    )

    text = normalize_nepali_digits(text)

    return text


# --------------------------------------------------
# Extract Name Only
# --------------------------------------------------
def extract_name(text):

    name = None

    # Extract text after "नाम" or "नाम/थर"
    name_match = re.search(r"नाम[/थर]*\s*[:\-]?\s*(.*)", text)

    if name_match:
        raw_name = name_match.group(1)
        raw_name = raw_name.split("\n")[0]
        name = clean_name(raw_name)

    return name


# --------------------------------------------------
# Similarity Function
# --------------------------------------------------
def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


# --------------------------------------------------
# MAIN VERIFICATION (NAME ONLY)
# --------------------------------------------------
def verify_documents(file_paths):

    extracted_data = []

    for path in file_paths:
        text = extract_text(path)
        name = extract_name(text)

        print("Extracted Name:", name)
        extracted_data.append({
            "name": name
        })

    names = [doc["name"] for doc in extracted_data if doc["name"]]

    verified = False
    confidence = 0

    # Require all 3 names
    if len(names) == 3:

        score1 = similarity(names[0], names[1])
        score2 = similarity(names[1], names[2])

        if score1 > 0.80 and score2 > 0.80:
            verified = True
            confidence = round((score1 + score2) / 2 * 100, 2)

    return {
        "verified": verified,
        "confidence_score": confidence,
        "documents": extracted_data
    }