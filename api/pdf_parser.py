import pdfplumber
import re
import io
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image

def extract_text_from_pdf(file_content):
    """
    Step 1 & 2: Try pdfplumber first, fallback to OCR if text is too short.
    """
    text = ""
    tables_data = []
    mode = "Text Extraction"
    
    # Try pdfplumber
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                
                # Still extract tables if available in text mode
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        tables_data.append([str(cell).strip() for cell in row if cell])
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")

    # Step 2: Fallback to OCR if text is empty or too short (< 100 chars)
    if len(text.strip()) < 100:
        print("Text extraction too short, falling back to OCR...")
        mode = "OCR (Tesseract)"
        try:
            # Step 3: Use pdf2image to convert PDF bytes to images
            images = convert_from_bytes(file_content)
            ocr_text = ""
            for i, image in enumerate(images):
                # Step 4: Run pytesseract on each image
                page_ocr = pytesseract.image_to_string(image)
                ocr_text += page_ocr + "\n"
            text = ocr_text
        except Exception as e:
            print(f"OCR fallback failed: {e}. Ensure Tesseract-OCR is installed on the system.")
            mode = "Failed (Empty PDF)"

    return text, tables_data, mode

def extract_invoice_data(file_content):
    """
    Extracts invoice data using a hybrid text/OCR pipeline and Regex.
    """
    text, tables_data, mode = extract_text_from_pdf(file_content)
    
    # Step 4: Regex Patterns for robust field extraction
    patterns = {
        "invoice_id": [
            r"Invoice (?:No|Number|ID)[:\s]*([A-Z0-9-]+)",
            r"(?:Inv|Invoice)[:\s]*#?\s*([A-Z0-9-]+)",
            r"Bill (?:No|Number)[:\s]*([A-Z0-9-]+)"
        ],
        "seller_gstin": [
            r"Seller GSTIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})",
            r"From[:\s\w]*GSTIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})",
            r"GSTIN/UIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})"
        ],
        "buyer_gstin": [
            r"Buyer GSTIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})",
            r"To[:\s\w]*GSTIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})",
            r"Recipient GSTIN[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})"
        ],
        "invoice_amount": [
            r"Total Amount[:\s]*₹?([\d,]+\.?\d*)",
            r"Grand Total[:\s]*₹?([\d,]+\.?\d*)",
            r"Total[:\s]*₹?([\d,]+\.?\d*)",
            r"Invoice Value[:\s]*₹?([\d,]+\.?\d*)"
        ],
        "gst_rate": [
            r"GST Rate[:\s]*(\d+(?:\.\d+)?)\s*%",
            r"IGST[:\s]*(\d+(?:\.\d+)?)\s*%",
            r"CGST/SGST[:\s]*(\d+(?:\.\d+)?)\s*%",
            r"Tax Rate[:\s]*(\d+(?:\.\d+)?)\s*%"
        ],
        "gst_amount": [
            r"GST Amount[:\s]*₹?([\d,]+\.?\d*)",
            r"Total Tax[:\s]*₹?([\d,]+\.?\d*)",
            r"IGST Amount[:\s]*₹?([\d,]+\.?\d*)",
            r"Tax Amount[:\s]*₹?([\d,]+\.?\d*)"
        ]
    }
    
    extracted_data = {}
    
    # Try extraction from main text
    for key, pattern_list in patterns.items():
        found = False
        for pattern in pattern_list:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).replace(",", "")
                try:
                    if key in ["invoice_amount", "gst_amount"]:
                        extracted_data[key] = float(value)
                    elif key == "gst_rate":
                        extracted_data[key] = float(value) / 100.0
                    else:
                        extracted_data[key] = value
                    found = True
                    break
                except: continue
        
        # Try table extraction if not found in main text
        if not found and tables_data:
            for row in tables_data:
                row_str = " ".join(row)
                for pattern in pattern_list:
                    match = re.search(pattern, row_str, re.IGNORECASE)
                    if match:
                        value = match.group(1).replace(",", "")
                        try:
                            if key in ["invoice_amount", "gst_amount"]:
                                extracted_data[key] = float(value)
                            elif key == "gst_rate":
                                extracted_data[key] = float(value) / 100.0
                            else:
                                extracted_data[key] = value
                            found = True
                            break
                        except: continue
                if found: break

        # Default values for missing fields
        if key not in extracted_data:
            if key in ["invoice_amount", "gst_amount", "gst_rate"]:
                extracted_data[key] = 0.0
            else:
                extracted_data[key] = "NOT_FOUND"
                
    return extracted_data, mode
