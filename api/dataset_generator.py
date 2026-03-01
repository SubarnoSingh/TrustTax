import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def generate_gstin():
    """Generate a random GSTIN format string."""
    state_code = f"{random.randint(1, 37):02d}"
    pan = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
    pan += f"{random.randint(1000, 9999):04d}"
    pan += random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    entity_code = str(random.randint(1, 9))
    z = "Z"
    check_digit = str(random.randint(0, 9))
    return f"{state_code}{pan}{entity_code}{z}{check_digit}"

def generate_dataset(num_records=1000):
    """Generate a simulated GST invoice dataset with fraud patterns."""
    
    # Common GST rates in India
    gst_rates = [0.05, 0.12, 0.18, 0.28]
    
    data = []
    
    # Create a pool of sellers and buyers to simulate repeated transactions
    sellers = [generate_gstin() for _ in range(50)]
    buyers = [generate_gstin() for _ in range(100)]
    
    start_date = datetime(2023, 1, 1)
    
    for i in range(num_records):
        invoice_id = f"INV{1000 + i}"
        
        # Introduce fraud patterns based on probability
        is_fraud = False
        fraud_type = "None"
        
        # 5% chance of abnormally high invoice amount
        if random.random() < 0.05:
            invoice_amount = round(random.uniform(500000, 2000000), 2)
            fraud_type = "High Amount"
            is_fraud = True
        else:
            invoice_amount = round(random.uniform(1000, 50000), 2)
            
        # Select seller and buyer
        # 10% chance of repeated suspicious transaction (same pair)
        if random.random() < 0.1:
            seller_gstin = sellers[0] # Force a specific seller
            buyer_gstin = buyers[0]   # Force a specific buyer
            fraud_type = "Repeated Transaction" if not is_fraud else fraud_type + ", Repeated Transaction"
        else:
            seller_gstin = random.choice(sellers)
            buyer_gstin = random.choice(buyers)
            
        # Select GST rate
        # 2% chance of suspicious GST rate (not in standard slabs)
        if random.random() < 0.02:
            gst_rate = round(random.uniform(0.01, 0.40), 2)
            fraud_type = "Suspicious Rate" if not is_fraud else fraud_type + ", Suspicious Rate"
            is_fraud = True
        else:
            gst_rate = random.choice(gst_rates)
            
        # Calculate GST amount
        # 3% chance of incorrect GST calculation
        if random.random() < 0.03:
            # Incorrect calculation
            gst_amount = round(invoice_amount * gst_rate * random.uniform(0.5, 1.5), 2)
            fraud_type = " GST Mismatch" if not is_fraud else fraud_type + ", GST Mismatch"
            is_fraud = True
        else:
            # Correct calculation
            gst_amount = round(invoice_amount * gst_rate, 2)
            
        # Random date within the last year
        invoice_date = (start_date + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
        
        data.append({
            "invoice_id": invoice_id,
            "seller_gstin": seller_gstin,
            "buyer_gstin": buyer_gstin,
            "invoice_amount": invoice_amount,
            "gst_rate": gst_rate,
            "gst_amount": gst_amount,
            "invoice_date": invoice_date,
            # "is_fraud": is_fraud, # Hidden label for testing if needed
            # "fraud_type": fraud_type
        })
        
    df = pd.DataFrame(data)
    
    # Ensure data directory exists
    # Use absolute path relative to this script
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    output_path = os.path.join(data_dir, "invoices.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {num_records} invoices and saved to {output_path}")
    
    return output_path

if __name__ == "__main__":
    generate_dataset()
