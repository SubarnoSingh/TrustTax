from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import sys
import numpy as np

# Add current directory to path to allow importing modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import rules
import model
import pdf_parser

app = FastAPI(title="GST Fraud Pattern Detection System")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
DATA_PATH = os.path.join(DATA_DIR, "invoices.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

def load_data():
    if os.path.exists(DATA_PATH):
        return pd.read_csv(DATA_PATH)
    return pd.DataFrame()

# Initialize model
anomaly_detector = model.AnomalyDetector()

# Check if model exists, if not train it
if not anomaly_detector.load_model():
    print("Model not found. Training new model...")
    df = load_data()
    if not df.empty:
        anomaly_detector.train(df)
    else:
        print("No data available to train model.")

@app.get("/")
def read_root():
    return {"message": "Welcome to GST Fraud Detection System API"}

@app.get("/invoices")
def get_invoices():
    df = load_data()
    if df.empty:
        return {"error": "No data found. Please generate dataset first."}
    # Convert NaN to None for JSON compatibility
    return df.where(pd.notnull(df), None).to_dict(orient="records")

@app.get("/detect-fraud")
def detect_fraud():
    df = load_data()
    if df.empty:
        return {"error": "No data found"}
    
    results = []
    
    # 1. Apply Rule-Based Engine
    avg_invoice_amount = df['invoice_amount'].mean()
    suspicious_pairs = rules.check_repeated_transactions(df)
    
    # 2. Apply Anomaly Detection Model
    try:
        # Returns 1 for normal, -1 for anomaly
        anomaly_predictions = anomaly_detector.predict(df) 
    except Exception as e:
        return {"error": f"Model prediction failed: {str(e)}"}
    
    # Iterate with index to access predictions
    for i, (index, row) in enumerate(df.iterrows()):
        risk_score = 0
        flags = []
        
        # Rule 1: GST Mismatch (+40)
        if rules.check_gst_mismatch(row):
            risk_score += 40
            flags.append("GST Mismatch")
            
        # Rule 2: Large Invoice (+20)
        if rules.check_high_invoice_amount(row, avg_invoice_amount):
            risk_score += 20
            flags.append("Unusually large invoice")
            
        # Rule 3: Repeated Transactions (+20)
        if (row['seller_gstin'], row['buyer_gstin']) in suspicious_pairs:
            risk_score += 20
            flags.append("Repeated transactions")
            
        # Anomaly Detection (+40)
        if anomaly_predictions[i] == -1:
            risk_score += 40
            flags.append("Anomaly detected")
            
        # Cap score at 100
        risk_score = min(risk_score, 100)
        
        # Determine Risk Level
        if risk_score < 30:
            risk_level = "Safe"
        elif risk_score < 70:
            risk_level = "Medium Risk"
        else:
            risk_level = "High Risk"
            
        results.append({
            "invoice_id": row['invoice_id'],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "flags": flags
        })
        
    # Sort by risk score descending
    results.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Filter to show only suspicious ones (risk > 0)
    suspicious_results = [r for r in results if r['risk_score'] > 0]
    
    return suspicious_results

@app.get("/fraud-summary")
def get_fraud_summary():
    df = load_data()
    if df.empty:
        return {"error": "No data found"}
    
    # Get detections
    # We call the logic directly instead of the endpoint function to avoid re-reading data if we refactored
    # But for simplicity, let's just call the endpoint function as it handles the logic
    detections = detect_fraud()
    
    if isinstance(detections, dict) and "error" in detections:
         return detections
         
    total_invoices = len(df)
    suspicious_count = len(detections)
    
    # Calculate fraud percentage
    if total_invoices > 0:
        fraud_percentage = round((suspicious_count / total_invoices) * 100, 2)
    else:
        fraud_percentage = 0.0
    
    return {
        "total_invoices": total_invoices,
        "suspicious_invoices": suspicious_count,
        "fraud_percentage": f"{fraud_percentage}%"
    }

@app.post("/analyze-invoice")
async def analyze_invoice(file: UploadFile = File(...)):
    """
    Analyzes an uploaded GST invoice PDF for fraud.
    """
    if not file.filename.endswith(".pdf"):
        return {"error": "Only PDF files are supported"}
        
    # Read file content
    content = await file.read()
    
    # Extract data from PDF
    try:
        invoice_data, mode = pdf_parser.extract_invoice_data(content)
    except Exception as e:
        return {"error": f"Failed to extract data from PDF: {str(e)}"}
        
    # Load dataset for context (avg amount, model training etc)
    df = load_data()
    if df.empty:
        return {"error": "Backend dataset missing. Please generate dataset first."}
        
    # Prepare results
    risk_score = 0
    flags = []
    
    # Rule 1: GST Mismatch (+40)
    if rules.check_gst_mismatch(invoice_data):
        risk_score += 40
        flags.append("GST Mismatch")
        
    # Rule 2: Large Invoice (+20)
    avg_invoice_amount = df['invoice_amount'].mean()
    if rules.check_high_invoice_amount(invoice_data, avg_invoice_amount):
        risk_score += 20
        flags.append("Unusually large invoice")
        
    # Rule 3: Anomaly Detection (+40)
    try:
        # We need to create a small dataframe for prediction
        single_invoice_df = pd.DataFrame([invoice_data])
        anomaly_prediction = anomaly_detector.predict(single_invoice_df)
        if anomaly_prediction[0] == -1:
            risk_score += 40
            flags.append("Anomaly detected")
    except Exception as e:
        print(f"Model prediction failed for uploaded invoice: {str(e)}")
        
    # Cap score at 100
    risk_score = min(risk_score, 100)
    
    return {
        "invoice_id": invoice_data.get("invoice_id", "UNKNOWN"),
        "risk_score": risk_score,
        "flags": flags,
        "extracted_data": invoice_data, # For transparency in demo
        "extraction_mode": mode
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
