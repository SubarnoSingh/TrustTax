import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.features = ['invoice_amount', 'gst_amount', 'gst_rate']

    def train(self, df):
        """
        Train the Isolation Forest model on the provided dataframe.
        """
        X = df[self.features]
        # Contamination is the proportion of outliers in the data set
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.model.fit(X)
        print("Model trained successfully.")
        
        # Save the model
        joblib.dump(self.model, MODEL_PATH)

    def load_model(self):
        """
        Load the trained model from disk.
        """
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            return True
        return False

    def predict(self, df):
        """
        Predict anomalies for the given dataframe.
        Returns: 1 for normal, -1 for anomaly.
        """
        if self.model is None:
            if not self.load_model():
                raise Exception("Model not trained or loaded.")
        
        X = df[self.features]
        predictions = self.model.predict(X)
        return predictions

def train_and_save_model(data_path=None):
    if data_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_path = os.path.join(base_dir, "data", "invoices.csv")
        
    df = pd.read_csv(data_path)
    detector = AnomalyDetector()
    detector.train(df)
    return detector

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "invoices.csv")
    
    # Ensure data directory exists and has data
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Please run dataset_generator.py first.")
    else:
        train_and_save_model(data_path)
