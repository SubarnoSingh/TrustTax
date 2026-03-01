import pandas as pd

def check_gst_mismatch(row):
    """
    Rule 1: Check if GST amount matches the expected value (invoice_amount * gst_rate).
    Allow a small tolerance for rounding errors.
    """
    expected_gst = row['invoice_amount'] * row['gst_rate']
    # Tolerance of 1.0 to account for rounding differences
    if abs(expected_gst - row['gst_amount']) > 1.0:
        return True
    return False

def check_high_invoice_amount(row, avg_amount):
    """
    Rule 2: Check if invoice amount is greater than 3x the average.
    """
    if row['invoice_amount'] > 3 * avg_amount:
        return True
    return False

def check_repeated_transactions(df):
    """
    Rule 3: Check for repeated transactions between same buyer and seller.
    We'll flag pairs that appear more than a threshold (e.g., 5 times).
    """
    # Count occurrences of (seller, buyer) pairs
    pair_counts = df.groupby(['seller_gstin', 'buyer_gstin']).size().reset_index(name='count')
    
    # Filter pairs with high frequency (e.g., > 2 for this small dataset, or based on time)
    # Since the requirement says "Repeated transactions", let's flag if count > 1 (simplest interpretation)
    # or maybe a higher threshold. Let's use > 3 for 1000 records.
    suspicious_pairs = pair_counts[pair_counts['count'] > 3]
    
    # Create a set of suspicious pairs for fast lookup
    suspicious_set = set(zip(suspicious_pairs['seller_gstin'], suspicious_pairs['buyer_gstin']))
    
    return suspicious_set

def apply_rules(df):
    """
    Apply all rules to the dataframe and return results.
    """
    results = []
    
    avg_invoice_amount = df['invoice_amount'].mean()
    suspicious_pairs = check_repeated_transactions(df)
    
    for index, row in df.iterrows():
        flags = []
        
        # Rule 1: GST Mismatch
        if check_gst_mismatch(row):
            flags.append("GST Mismatch")
            
        # Rule 2: High Invoice Amount
        if check_high_invoice_amount(row, avg_invoice_amount):
            flags.append("Unusually large invoice")
            
        # Rule 3: Repeated Transactions
        if (row['seller_gstin'], row['buyer_gstin']) in suspicious_pairs:
            flags.append("Repeated transactions")
            
        results.append({
            "invoice_id": row['invoice_id'],
            "rule_flags": flags,
            "rule_score": len(flags) * 20 # Simple scoring for now, will be refined in main logic
        })
        
    return pd.DataFrame(results)
